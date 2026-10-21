import express from 'express'
import cors from 'cors'
import { bootstrap, exportToJson, openDb, SQLITE_PATH } from './db.mjs'

const PORT = Number(process.env.MTH_API_PORT || 8787)
const db = openDb()
const boot = bootstrap(db)
if (boot.imported) {
  console.log(`[mth-api] seeded sqlite from favorites.json (${boot.sentences} sentences)`)
}

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, sqlite: true })
})

app.get('/api/favorites/sids', (_req, res) => {
  const rows = db.prepare('SELECT sid FROM favorite_sentences').all()
  res.json(rows.map((r) => r.sid))
})

app.get('/api/favorites/sentences', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT sid, book_id AS bookId, chapter_id AS chapterId, en_text AS enText,
              zh_text AS zhText, created_at AS createdAt
       FROM favorite_sentences ORDER BY created_at DESC`,
    )
    .all()
  res.json(rows)
})

app.post('/api/favorites/sentences/toggle', (req, res) => {
  const { sid, bookId, chapterId, enText, zhText } = req.body ?? {}
  if (!sid || typeof sid !== 'string' || sid.length > 80) {
    return res.status(400).json({ error: 'invalid sid' })
  }
  const exists = db.prepare('SELECT 1 FROM favorite_sentences WHERE sid = ?').get(sid)
  if (exists) {
    db.prepare('DELETE FROM favorite_sentences WHERE sid = ?').run(sid)
    return res.json({ favorited: false })
  }
  db.prepare(
    `INSERT INTO favorite_sentences (sid, book_id, chapter_id, en_text, zh_text, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(sid, bookId ?? '', chapterId ?? '', enText ?? '', zhText ?? '', Date.now())
  res.json({ favorited: true })
})

app.post('/api/favorites/export', (_req, res) => {
  const payload = exportToJson(db)
  res.json({
    ok: true,
    path: 'data/favorites.json',
    counts: { sentences: payload.sentences.length },
  })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`[mth-api] http://127.0.0.1:${PORT}`)
  console.log(`[mth-api] sqlite: ${SQLITE_PATH}`)
})
