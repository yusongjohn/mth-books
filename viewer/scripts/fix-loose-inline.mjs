#!/usr/bin/env node
// Fold loose inline markup outside cue spans back into sentences; drop <i>/<b>/...
// Usage: node scripts/fix-loose-inline.mjs [--write]
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const write = process.argv.includes('--write')

const EN_RE = /(<span class="en">)([\s\S]*?)(<\/span>\s*<span class="zh")/g
const CUE_RE = /<span (?:data-sid="([^"]+)" )?class="cue" data-start="([^"]+)">([\s\S]*?)<\/span>/g
const ENDED_RE = /[.!?][”’"]?$/
const SENTENCE_END_RE = /[.!?]+[”’"]?(?=\s*$|\s+[“‘"([]?[A-Z0-9])/g
const ABBR_RE = /\b(?:Mr|Mrs|Ms|Dr|St)\.$/
const CONTRACTION = /^(s|t|re|ve|ll|d)\b/i

/** Strip tags; insert a space when tags sit between two word chars (e.g. it</i><u>will</u><i>be). */
function plain(s) {
  let t = s
  while (/(\w)(?:<[^>]+>)+(\w)/.test(t)) t = t.replace(/(\w)(?:<[^>]+>)+(\w)/g, '$1 $2')
  // also letter + tags + punct that starts a word-ish token is fine via strip
  t = t.replace(/(['’])\s*(?:<[^>]+>\s*)+(s|t|re|ve|ll|d)\b/gi, '$1$2')
  // period/question glued to next capital via missing space between tags/blocks
  t = t.replace(/([.!?…”’"])((?:<[^>]+>)*)([A-Z])/g, '$1$2 $3')
  return t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ')
}

function join(a, b) {
  a = a.trimEnd()
  b = b.trimStart()
  if (!a) return b
  if (!b) return a
  if (/[“‘(]$/.test(a) || /^[,.;:!?”’)…]/.test(b)) return a + b
  if (/['’]$/.test(a) && CONTRACTION.test(b)) return a + b
  return `${a} ${b}`
}

function firstSentenceEnd(text) {
  SENTENCE_END_RE.lastIndex = 0
  let m
  while ((m = SENTENCE_END_RE.exec(text))) {
    const end = m.index + m[0].length
    if (!ABBR_RE.test(text.slice(0, end))) return end
  }
  return -1
}

function tokenize(block) {
  const tokens = []
  let last = 0
  for (const m of block.matchAll(CUE_RE)) {
    const between = plain(block.slice(last, m.index)).trim()
    if (between) tokens.push({ loose: between })
    tokens.push({ sid: m[1], start: m[2], text: plain(m[3]).trim() })
    last = m.index + m[0].length
  }
  const tail = plain(block.slice(last)).trim()
  if (tail) tokens.push({ loose: tail })
  return tokens
}

function hasWord(s) {
  return /[A-Za-z0-9]/.test(s)
}

function fixBlock(block, stats) {
  const tokens = tokenize(block)
  if (!tokens.some((t) => 'loose' in t)) return block
  if (!tokens.some((t) => !('loose' in t))) {
    stats.skipped++
    return block
  }

  const cues = []
  let pendingLead = ''
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]
    if (!('loose' in t)) {
      if (pendingLead) {
        t.text = join(pendingLead, t.text)
        pendingLead = ''
      }
      cues.push(t)
      continue
    }
    stats.fixed++
    const word = t.loose
    const prev = cues.findLast((c) => !c.drop)
    const next = tokens.slice(i + 1).find((x) => !('loose' in x))
    const prevText = prev?.text.trimEnd() ?? ''

    const attachesToPrev = /^[,.;:!?”’)…]/.test(word)
    if (!prev || (ENDED_RE.test(prevText) && !attachesToPrev)) {
      pendingLead = join(pendingLead, word)
      continue
    }
    if (/[“‘]$/.test(prevText) && next) {
      prev.text = prev.text.trimEnd().replace(/[“‘]$/, (q) => {
        pendingLead = join(q, word)
        return ''
      })
      continue
    }
    prev.text = join(prev.text, word)
    if (next && next.start === prev.start) {
      const closing = /^\s*[”’)]+/.exec(next.text)?.[0]
      if (closing) {
        prev.text = join(prev.text, closing)
        next.text = next.text.slice(closing.length)
      }
      if (!ENDED_RE.test(prev.text.trimEnd())) {
        const cut = firstSentenceEnd(next.text)
        const head = cut === -1 ? next.text : next.text.slice(0, cut)
        prev.text = join(prev.text, head)
        next.text = cut === -1 ? '' : next.text.slice(cut)
      }
      next.text = next.text.trim()
      // cue that is only an opening quote → push to following sentence
      if (/^[“‘]+$/.test(next.text)) {
        pendingLead = join(pendingLead, next.text)
        next.text = ''
      }
      next.drop = !hasWord(next.text)
    }
  }
  if (pendingLead) {
    const last = cues.findLast((c) => !c.drop)
    if (last) last.text = join(last.text, pendingLead)
  }

  // Merge orphan attribution / leftover punctuation into previous cue
  for (let i = 1; i < cues.length; i++) {
    const c = cues[i]
    if (c.drop) continue
    if (!hasWord(c.text) || /^[,.”’)\]]+/.test(c.text.trim())) {
      const prev = cues.slice(0, i).reverse().find((x) => !x.drop)
      if (prev) {
        prev.text = join(prev.text, c.text)
        c.drop = true
      }
    }
  }

  const kept = cues.filter((c) => !c.drop && hasWord(c.text))
  stats.dropped += cues.length - kept.length
  const body = kept
    .map((c, idx) => {
      const text = c.text.trim()
      const isLast = idx === kept.length - 1
      const sidAttr = c.sid ? `data-sid="${c.sid}" ` : ''
      return `\n            <span ${sidAttr}class="cue" data-start="${c.start}">${isLast ? text : `${text} `}</span>`
    })
    .join('')
  return `${body}\n      `
}

const stats = { files: 0, changedFiles: 0, fixed: 0, dropped: 0, skipped: 0, textMismatch: 0 }
const preview = []
for (const book of fs.readdirSync(root).filter((d) => /^\d+-/.test(d)).sort()) {
  const chDir = path.join(root, book, 'chapters')
  for (const ch of fs.readdirSync(chDir).sort()) {
    const file = path.join(chDir, ch, `${ch}.html`)
    const html = fs.readFileSync(file, 'utf8')
    stats.files++
    const out = html.replace(EN_RE, (all, open, block, close) => {
      let fixed = fixBlock(block, stats)
      // Allow inserted spaces; forbid lost/added letters & punctuation
      const squash = (s) => plain(s).replace(/\s+/g, '')
      if (fixed !== block && squash(fixed) !== squash(block)) {
        stats.textMismatch++
        console.error(`text mismatch in ${ch}: ${plain(block).replace(/\s+/g, ' ').trim()}`)
        if (process.argv.includes('--verbose')) console.error(`RAW:${block}\nFIXED:${fixed}\n`)
        fixed = block
      }
      if (fixed !== block && preview.length < 8) {
        preview.push(
          `${ch}:\n  - ${plain(block).replace(/\s+/g, ' ').trim()}\n  + ${fixed
            .match(/<span [^>]*class="cue"[\s\S]*?<\/span>/g)
            .map((s) => `[${plain(s).trim()}]`)
            .join(' ')}`,
        )
      }
      return open + fixed + close
    })
    if (out !== html) {
      stats.changedFiles++
      if (write) fs.writeFileSync(file, out, 'utf8')
    }
  }
}

console.log(preview.join('\n'))
console.log(stats, write ? '(written)' : '(dry run, pass --write to apply)')
