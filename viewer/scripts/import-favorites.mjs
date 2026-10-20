#!/usr/bin/env node
import { importFromJson, JSON_PATH, openDb, SQLITE_PATH } from '../server/db.mjs'

const db = openDb()
const result = importFromJson(db)
db.close()
if (!result.imported) {
  console.error(`Import skipped: ${result.reason} (${JSON_PATH})`)
  process.exit(1)
}
console.log(`Imported ${result.sentences} sentences -> ${SQLITE_PATH}`)
