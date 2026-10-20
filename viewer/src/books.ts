const loaders = import.meta.glob<string>('../../*/chapters/*/*.html', {
  query: '?raw',
  import: 'default',
})

export interface Chapter {
  id: string
  number: number
  title: string
  load: () => Promise<string>
}

export interface Book {
  id: string
  number: number
  title: string
  /** The time of day, weekday or season named in the title, if any. */
  time: string
  chapters: Chapter[]
}

/** Longest phrases first so "Early Morning" wins over "Morning". */
const TIME_PHRASES = [
  'Christmas Time', 'Dead of Night', 'Early Morning', 'Summer Night', 'Good Morning', 'Hallows Eve',
  'Late Winter', 'Perfect Time', 'Good Night', 'High Time', 'High Tide', 'Blue Moon', 'Blue Dawn',
  'Red Dawn', 'Crazy Day', 'Dark Day', 'Before Dark', 'Afternoon', 'Midnight', 'Daybreak', 'Sundown',
  'Lunchtime', 'Bedtime', 'Sunrise', 'Tonight', 'Breakfast', 'Twilight', 'Dinnertime', 'Candlelight',
  'Moonlight', 'Starlight', 'Christmas', 'Wednesday', 'Thursday', 'Tuesday', 'Sunday', 'Monday',
  'Morning', 'Sunset', 'Season', 'Summer', 'Winter', 'Night', 'Dawn', 'Noon', 'Hour', 'Last', 'Day', 'Eve',
]

function timeFromTitle(title: string): string {
  const lower = title.toLowerCase()
  return TIME_PHRASES.find((p) => new RegExp(`\\b${p.toLowerCase()}\\b`).test(lower)) ?? ''
}

const SMALL_WORDS = new Set(['a', 'an', 'the', 'of', 'on', 'in', 'at', 'by', 'for', 'with', 'to', 'and', 'past', 'under'])

function titleFromSlug(slug: string): { number: number; title: string } {
  const match = /^(\d+)-(.*)$/.exec(slug)
  const number = match ? Number(match[1]) : 0
  const words = (match ? match[2] : slug).split('-')
  const title = words
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
  return { number, title }
}

function buildBooks(): Book[] {
  const byId = new Map<string, Book>()
  for (const [path, load] of Object.entries(loaders)) {
    const parts = path.split('/')
    const bookSlug = parts[2]
    const chapterSlug = parts[4]
    let book = byId.get(bookSlug)
    if (!book) {
      const { number, title } = titleFromSlug(bookSlug)
      book = { id: bookSlug, number, title, time: timeFromTitle(title), chapters: [] }
      byId.set(bookSlug, book)
    }
    book.chapters.push({ id: chapterSlug, ...titleFromSlug(chapterSlug), load })
  }
  const books = [...byId.values()].sort((a, b) => a.number - b.number)
  for (const book of books) book.chapters.sort((a, b) => a.number - b.number)
  return books
}

export const books = buildBooks()
