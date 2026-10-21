import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = path.resolve(__dirname, '../../data')
export const SQLITE_PATH = path.join(DATA_DIR, 'favorites.sqlite')
export const JSON_PATH = path.join(DATA_DIR, 'favorites.json')

function migrate(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS favorite_sentences (
      sid TEXT PRIMARY KEY,
      book_id TEXT NOT NULL,
      chapter_id TEXT NOT NULL,
      en_text TEXT NOT NULL,
      zh_text TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL
    );
  `)
  // Drop legacy vocab tables if present (word favorites removed).
  db.exec(`
    DROP TABLE IF EXISTS vocab_word_sentences;
    DROP TABLE IF EXISTS vocab_words;
  `)
}

export function openDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  const db = new Database(SQLITE_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  migrate(db)
  return db
}

export function exportToJson(db = openDb()) {
  const sentences = db
    .prepare(
      `SELECT sid, book_id AS bookId, chapter_id AS chapterId, en_text AS enText,
              zh_text AS zhText, created_at AS createdAt
       FROM favorite_sentences ORDER BY created_at DESC`,
    )
    .all()

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sentences,
  }

  fs.writeFileSync(JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  return payload
}

export function importFromJson(db = openDb()) {
  if (!fs.existsSync(JSON_PATH)) return { imported: false, reason: 'no-json' }
  const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))
  const sentences = raw.sentences ?? []

  const tx = db.transaction(() => {
    db.exec('DELETE FROM favorite_sentences;')

    const insSent = db.prepare(
      `INSERT INTO favorite_sentences (sid, book_id, chapter_id, en_text, zh_text, created_at)
       VALUES (@sid, @bookId, @chapterId, @enText, @zhText, @createdAt)`,
    )
    for (const s of sentences) insSent.run(s)
  })

  tx()
  return { imported: true, sentences: sentences.length }
}

/** If sqlite is empty but JSON exists, seed from JSON. */
export function bootstrap(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM favorite_sentences').get().c
  if (count === 0 && fs.existsSync(JSON_PATH)) {
    return importFromJson(db)
  }
  return { imported: false, reason: 'already-has-data' }
}
