#!/usr/bin/env node
import { exportToJson, JSON_PATH, openDb, SQLITE_PATH } from '../server/db.mjs'

const db = openDb()
const payload = exportToJson(db)
db.close()
console.log(`Exported ${payload.sentences.length} sentences`)
console.log(`  sqlite: ${SQLITE_PATH}`)
console.log(`  json:   ${JSON_PATH}`)
