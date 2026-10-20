// Dev-only capture helper: emulates a viewport over CDP, waits for real content, screenshots.
import { spawn } from 'node:child_process'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL_ = 'http://127.0.0.1:5173/#/03-mummies-in-the-morning/01-meow'
const PORT = 9333
const shots = [
  { file: 'mobile.png', width: 390, height: 844, mobile: true, scroll: 0 },
  { file: 'mobile-reading.png', width: 390, height: 844, mobile: true, scroll: 'reading' },
  { file: 'desktop.png', width: 1440, height: 900, mobile: false, scroll: 0 },
  { file: 'desktop-scrolled.png', width: 1440, height: 900, mobile: false, scroll: 700 },
]

const userDir = mkdtempSync(path.join(tmpdir(), 'mth-cap-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${userDir}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()
      const page = list.find((t) => t.type === 'page')
      if (page) return page.webSocketDebuggerUrl
    } catch {}
    await sleep(200)
  }
  throw new Error('chrome did not start')
}

const ws = new WebSocket(await target())
await new Promise((r) => ws.addEventListener('open', r, { once: true }))
let id = 0
const pending = new Map()
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data)
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg)
    pending.delete(msg.id)
  }
})
const send = (method, params = {}) =>
  new Promise((resolve) => {
    const n = ++id
    pending.set(n, resolve)
    ws.send(JSON.stringify({ id: n, method, params }))
  })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value

try {
  for (const s of shots) {
    await send('Emulation.setDeviceMetricsOverride', { width: s.width, height: s.height, deviceScaleFactor: 1, mobile: s.mobile })
    await send('Page.navigate', { url: 'about:blank' })
    await sleep(200)
    await send('Page.navigate', { url: URL_ })
    for (let i = 0; i < 100; i++) {
      const ok = await evaluate(`!!document.querySelector('.content .fav-btn') && !document.body.innerText.includes('加载中')`)
      if (ok) break
      await sleep(150)
    }
    await sleep(500)
    if (s.scroll === 'reading') {
      await evaluate(`window.scrollTo(0, document.querySelector('main').getBoundingClientRect().top + window.scrollY + 120)`)
    } else if (s.scroll) {
      await evaluate(`window.scrollTo(0, ${s.scroll})`)
    }
    await sleep(800)
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(path.join(import.meta.dirname, s.file), Buffer.from(shot.result.data, 'base64'))
    console.log('wrote', s.file)
  }
} finally {
  ws.close()
  chrome.kill()
}
