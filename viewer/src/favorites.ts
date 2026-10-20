/** Helpers for decorating chapter HTML with favorite UI. Each `.en .cue[data-sid]` is one sentence. */

function zhForCue(cue: HTMLElement): string {
  const start = cue.getAttribute('data-start')
  const line = cue.closest('p.line')
  if (!line || !start) return ''
  const zh = line.querySelector(`.zh .cue[data-start="${CSS.escape(start)}"]`)
  return zh?.textContent?.trim() ?? ''
}

const SVG_NS = 'http://www.w3.org/2000/svg'

/** A bookmark tab: the timetable's "kept" mark. */
function tabIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 12 16')
  svg.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', 'M1.5 1.5h9v13L6 11l-4.5 3.5z')
  svg.append(path)
  return svg
}

function setup(cue: HTMLElement) {
  if (cue.dataset.favReady) return
  cue.dataset.favReady = '1'
  const en = cue.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'fav-btn'
  btn.dataset.sid = cue.dataset.sid
  btn.dataset.en = en
  btn.dataset.zh = zhForCue(cue)
  btn.append(tabIcon())
  cue.append(btn)
}

export function decorateContent(
  root: HTMLElement,
  opts: {
    favoriteSids: Set<string>
  },
) {
  root.querySelectorAll('.is-fav').forEach((el) => el.classList.remove('is-fav'))
  root.querySelectorAll<HTMLElement>('.en .cue[data-sid]').forEach((cue) => {
    setup(cue)
    const sid = cue.dataset.sid!
    const btn = cue.querySelector<HTMLButtonElement>('button.fav-btn')!
    const on = opts.favoriteSids.has(sid)
    if (on) {
      cue.classList.add('is-fav')
      const start = cue.getAttribute('data-start')
      if (start) {
        cue
          .closest('p.line')
          ?.querySelector(`.zh .cue[data-start="${CSS.escape(start)}"]`)
          ?.classList.add('is-fav')
      }
    }
    btn.classList.toggle('on', on)
    btn.title = on ? '取消收藏句子' : '收藏句子'
    btn.setAttribute('aria-label', btn.title)
    btn.setAttribute('aria-pressed', String(on))
  })
}
