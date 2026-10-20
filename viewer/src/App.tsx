import { useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Bookmark, Search } from 'lucide-react'
import { books, type Book, type Chapter } from '@/books'
import {
  getDb,
  listFavoriteSentences,
  listFavoriteSids,
  toggleSentenceFavorite,
  type FavoriteSentence,
} from '@/db'
import { decorateContent } from '@/favorites'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type LangMode = 'both' | 'en' | 'zh'
type SidebarTab = 'books' | 'sentences'

const PREFS_KEY = 'mth-viewer-prefs'

interface Prefs {
  mode: LangMode
  fontSize: number
  onlyFavorites: boolean
}

function loadPrefs(): Prefs {
  const fallback: Prefs = { mode: 'both', fontSize: 18, onlyFavorites: false }
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>
    const mode = raw.mode === 'en' || raw.mode === 'zh' || raw.mode === 'both' ? raw.mode : fallback.mode
    const fontSize =
      typeof raw.fontSize === 'number' && raw.fontSize >= 12 && raw.fontSize <= 32 ? raw.fontSize : fallback.fontSize
    const onlyFavorites = raw.onlyFavorites === true
    return { mode, fontSize, onlyFavorites }
  } catch {
    return fallback
  }
}

function parseHash(): { book: Book; chapter: Chapter } {
  const [bookId, chapterId] = decodeURIComponent(location.hash.replace(/^#\/?/, '')).split('/')
  const book = books.find((b) => b.id === bookId) ?? books[0]
  const chapter = book.chapters.find((c) => c.id === chapterId) ?? book.chapters[0]
  return { book, chapter }
}

function navigate(book: Book, chapter: Chapter) {
  location.hash = `/${book.id}/${chapter.id}`
}

function goToSid(bookId: string, chapterId: string, sid: string) {
  const book = books.find((b) => b.id === bookId)
  const chapter = book?.chapters.find((c) => c.id === chapterId)
  if (!book || !chapter) return
  navigate(book, chapter)
  let tries = 0
  const seek = () => {
    const el = document.querySelector(`.cue[data-sid="${CSS.escape(sid)}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    else if (++tries < 60) requestAnimationFrame(seek)
  }
  requestAnimationFrame(seek)
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const LANG_MODES: [LangMode, string][] = [
  ['both', '中英'],
  ['en', '英文'],
  ['zh', '中文'],
]

const ROW_GRID = 'grid grid-cols-[24px_76px_minmax(0,1fr)_auto] gap-x-2.5 px-6 whitespace-nowrap [&>*:nth-child(3)]:whitespace-normal'

const switchItem =
  'h-8 rounded-sm px-3 font-board text-[15px] font-semibold tracking-wide text-board-muted hover:bg-ink-line hover:text-board-fg aria-pressed:bg-signal aria-pressed:text-ink data-[pressed]:bg-signal data-[pressed]:text-ink'

export default function App() {
  const [{ book, chapter }, setLocation] = useState(parseHash)
  const [prefs, setPrefs] = useState(loadPrefs)
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<string>(book.id)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())
  const [dbReady, setDbReady] = useState(false)
  const [favSids, setFavSids] = useState<Set<string>>(new Set())
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('books')
  const [favSentences, setFavSentences] = useState<FavoriteSentence[]>([])
  const contentRef = useRef<HTMLDivElement>(null)
  const activeBookRef = useRef<HTMLLIElement>(null)

  const refreshFavLists = async () => {
    setFavSentences(await listFavoriteSentences())
  }

  const refreshChapterFavs = async () => {
    setFavSids(await listFavoriteSids())
  }

  useEffect(() => {
    getDb()
      .then(async () => {
        setDbReady(true)
        await refreshFavLists()
        await refreshChapterFavs()
      })
      .catch((e: unknown) => {
        console.error('Local API init failed', e)
        setError('本地 API 未启动，请在 viewer 目录运行 npm run dev')
      })
  }, [])

  useEffect(() => {
    if (!dbReady) return
    void refreshChapterFavs()
  }, [dbReady, chapter.id])

  useEffect(() => {
    const onHash = () => setLocation(parseHash())
    window.addEventListener('hashchange', onHash)
    if (!location.hash) navigate(book, chapter)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  }, [prefs])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setRevealed(new Set())
    setExpanded(book.id)
    chapter
      .load()
      .then((raw) => {
        if (cancelled) return
        setHtml(DOMPurify.sanitize(raw))
        setLoading(false)
        window.scrollTo({ top: 0 })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        console.error('Failed to load chapter', chapter.id, e)
        setError('章节加载失败')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [book, chapter])

  useEffect(() => {
    activeBookRef.current?.scrollIntoView({ block: 'nearest' })
  }, [book, sidebarTab])

  useEffect(() => {
    const root = contentRef.current
    if (!root || loading || !html) return

    root.querySelectorAll('img').forEach((img) => {
      const hide = () => img.closest('.figure-with-note, .figure-image')?.classList.add('missing-image')
      if (img.complete && img.naturalWidth === 0) hide()
      else img.addEventListener('error', hide, { once: true })
    })
    root.querySelectorAll<HTMLElement>('p.line').forEach((p, i) => {
      p.dataset.idx = String(i)
      p.classList.toggle('revealed', revealed.has(i))
    })

    if (dbReady) {
      decorateContent(root, { favoriteSids: favSids })
    }
  }, [html, revealed, loading, dbReady, favSids])

  const neighbors = useMemo(() => {
    const flat = books.flatMap((b) => b.chapters.map((c) => ({ book: b, chapter: c })))
    const idx = flat.findIndex((x) => x.chapter === chapter)
    return { prev: flat[idx - 1], next: flat[idx + 1] }
  }, [chapter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowLeft' && neighbors.prev) navigate(neighbors.prev.book, neighbors.prev.chapter)
      if (e.key === 'ArrowRight' && neighbors.next) navigate(neighbors.next.book, neighbors.next.chapter)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [neighbors])

  const visibleBooks = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return books
    return books.filter((b) => `${b.number} ${b.title}`.toLowerCase().includes(q))
  }, [filter])

  const keptByBook = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of favSentences) counts.set(s.bookId, (counts.get(s.bookId) ?? 0) + 1)
    return counts
  }, [favSentences])

  const keptByChapter = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of favSentences) {
      const key = `${s.bookId}/${s.chapterId}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }
    return counts
  }, [favSentences])

  const keptChapters = useMemo(
    () => new Set(favSentences.filter((s) => s.bookId === book.id).map((s) => s.chapterId)),
    [favSentences, book.id],
  )

  const onContentClick = async (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const favBtn = target.closest<HTMLButtonElement>('button.fav-btn')
    if (favBtn) {
      e.preventDefault()
      e.stopPropagation()
      if (!dbReady) return
      const sid = favBtn.dataset.sid
      if (!sid) return
      try {
        const on = await toggleSentenceFavorite({
          sid,
          bookId: book.id,
          chapterId: chapter.id,
          enText: favBtn.dataset.en ?? '',
          zhText: favBtn.dataset.zh ?? '',
        })
        setFavSids(await listFavoriteSids())
        await refreshFavLists()
        toast(on ? '已收藏句子' : '已取消收藏')
      } catch (err) {
        console.error('Toggle favorite failed', err)
        toast.error('收藏失败，请确认本地 API 正在运行')
      }
      return
    }

    if (prefs.mode === 'both') return
    const line = target.closest<HTMLElement>('p.line')
    if (!line?.dataset.idx) return
    const idx = Number(line.dataset.idx)
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const stopIndex = book.chapters.indexOf(chapter)
  const stopCount = book.chapters.length
  const stopPct = (i: number) => (stopCount > 1 ? (i / (stopCount - 1)) * 100 : 0)
  const expressEmpty = prefs.onlyFavorites && dbReady && !keptChapters.has(chapter.id)
  const ready = !loading && !error

  return (
    <div className="grid min-h-screen grid-cols-[minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
      {/* Timetable */}
      <aside className="dark-frame flex max-h-[45vh] flex-col bg-ink text-board-fg lg:sticky lg:top-0 lg:h-screen lg:max-h-none">
        <header className="flex items-baseline justify-between px-6 pt-6 pb-4">
          <h1 className="font-board text-[22px] font-semibold tracking-wide uppercase">Magic Tree House</h1>
          <span className="font-board text-sm text-board-muted tabular-nums">{books.length} 本</span>
        </header>

        <Tabs
          value={sidebarTab}
          onValueChange={(v) => setSidebarTab(v as SidebarTab)}
          className="min-h-0 flex-1 gap-0"
        >
          <TabsList
            variant="line"
            className="h-10 w-full justify-start gap-5 rounded-none border-b border-ink-line px-6"
          >
            <TabsTrigger
              value="books"
              className="flex-none px-0 font-board text-base font-semibold tracking-wide text-board-muted uppercase after:bg-signal hover:text-board-fg data-active:text-board-fg"
            >
              时刻表
            </TabsTrigger>
            <TabsTrigger
              value="sentences"
              className="flex-none px-0 font-board text-base font-semibold tracking-wide text-board-muted uppercase after:bg-signal hover:text-board-fg data-active:text-board-fg"
            >
              收藏
              <span className="tabular-nums text-signal">{favSentences.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="flex min-h-0 flex-col">
            <div className="relative px-6 py-3">
              <Search className="pointer-events-none absolute top-1/2 left-9 size-4 -translate-y-1/2 text-board-muted" />
              <Input
                placeholder="搜索书名或编号"
                value={filter}
                maxLength={50}
                onChange={(e) => setFilter(e.target.value)}
                className="h-9 rounded-sm border-ink-line bg-ink-2 pl-9 text-board-fg placeholder:text-board-muted focus-visible:border-signal focus-visible:ring-0"
              />
            </div>
            <div className={cn(ROW_GRID, 'border-b border-ink-line pb-2 font-board text-xs font-semibold tracking-[0.14em] text-board-muted uppercase')}>
              <span>No.</span>
              <span>出发</span>
              <span>书名</span>
              <span>收藏</span>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <ul className="pb-6">
                {visibleBooks.length === 0 && <li className="px-6 py-4 text-sm text-board-muted">没有匹配的书</li>}
                {visibleBooks.map((b) => {
                  const kept = keptByBook.get(b.id) ?? 0
                  const current = b.id === book.id
                  return (
                    <li key={b.id} ref={current ? activeBookRef : undefined} className="border-b border-ink-line">
                      <button
                        aria-expanded={expanded === b.id}
                        onClick={() => setExpanded(expanded === b.id ? '' : b.id)}
                        className={cn(
                          ROW_GRID,
                          'w-full items-baseline py-2.5 text-left text-[14px] leading-snug transition-colors',
                          current ? 'bg-signal text-ink' : 'hover:bg-ink-2',
                        )}
                      >
                        <span className={cn('font-board text-[15px] font-semibold tabular-nums', current ? 'text-ink' : 'text-board-muted')}>
                          {pad2(b.number)}
                        </span>
                        <span
                          className={cn(
                            'font-board text-[13px] leading-tight font-semibold tracking-wide uppercase',
                            current ? 'text-ink' : 'text-board-fg',
                          )}
                        >
                          {b.time || '—'}
                        </span>
                        <span>{b.title}</span>
                        <span className={cn('font-board text-[15px] font-semibold tabular-nums', current ? 'text-ink' : 'text-signal')}>
                          {kept > 0 ? kept : ''}
                        </span>
                      </button>
                      {expanded === b.id && (
                        <ol className="relative py-2 pr-6 pl-[58px] before:absolute before:top-4 before:bottom-4 before:left-[42px] before:w-[2px] before:bg-ink-line">
                          {b.chapters.map((c) => {
                            const here = c === chapter
                            const kept = keptByChapter.get(`${b.id}/${c.id}`) ?? 0
                            return (
                              <li key={c.id}>
                                <button
                                  aria-current={here ? 'page' : undefined}
                                  onClick={() => navigate(b, c)}
                                  className={cn(
                                    'relative flex w-full items-baseline gap-2 rounded-sm py-1.5 pr-2 pl-1 text-left text-[13px] transition-colors',
                                    "before:absolute before:top-1/2 before:left-[-20px] before:size-2.5 before:-translate-y-1/2 before:rounded-full before:border-2 before:content-['']",
                                    here
                                      ? 'text-board-fg before:size-3 before:border-signal before:bg-signal'
                                      : 'text-board-muted before:border-board-muted before:bg-ink hover:text-board-fg',
                                  )}
                                >
                                  <span className="w-5 font-board font-semibold tabular-nums">{c.number}</span>
                                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                                  {kept > 0 && (
                                    <span
                                      className={cn(
                                        'ml-auto font-board text-[13px] font-semibold tabular-nums',
                                        here ? 'text-signal' : 'text-signal/80',
                                      )}
                                      title={`收藏 ${kept} 句`}
                                    >
                                      {kept}
                                    </span>
                                  )}
                                </button>
                              </li>
                            )
                          })}
                        </ol>
                      )}
                    </li>
                  )
                })}
              </ul>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="sentences" className="min-h-0">
            <ScrollArea className="h-full">
              <ul className="pb-6">
                {favSentences.length === 0 && (
                  <li className="px-6 py-6 text-sm leading-relaxed text-board-muted">
                    还没有收藏句子。读到喜欢的句子，点句末的书签。
                  </li>
                )}
                {favSentences.map((s) => (
                  <li key={s.sid} className="border-b border-ink-line">
                    <button
                      onClick={() => goToSid(s.bookId, s.chapterId, s.sid)}
                      className="flex w-full flex-col gap-1 px-6 py-3 text-left transition-colors hover:bg-ink-2"
                    >
                      <span className="font-read text-[15px] leading-snug text-board-fg">{s.enText}</span>
                      {s.zhText && <span className="text-[13px] leading-snug text-board-muted">{s.zhText}</span>}
                      <span className="font-board text-xs font-semibold tracking-wider text-signal tabular-nums uppercase">
                        {s.sid}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </aside>

      <main className="min-w-0">
        {/* Departure board: the head scrolls away, the route line and switches stay. */}
        <header className="dark-frame sticky top-[-104px] z-10 bg-ink text-board-fg shadow-[0_6px_16px_-10px_rgba(21,33,43,0.6)] md:top-[-88px]">
          <div className="flex h-[104px] flex-col justify-end gap-1.5 px-6 pb-2 md:h-[88px] md:flex-row md:items-end md:justify-between md:gap-8 md:px-8 lg:px-12">
            <h2 className="min-w-0 truncate font-board text-[38px] leading-none font-semibold tracking-tight md:text-[60px]" title={chapter.title}>
              {chapter.title}
            </h2>
            <p className="flex min-w-0 flex-wrap items-baseline gap-x-4 font-board text-[15px] font-medium text-board-muted md:shrink-0">
              <span className="font-semibold text-board-fg tabular-nums">No. {pad2(book.number)}</span>
              <TitleWithTime title={book.title} time={book.time} />
              <span className="tabular-nums">
                第 {chapter.number} 章 / 共 {stopCount} 章
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-10 gap-y-3 px-6 pt-4 pb-4 md:px-8 lg:px-12">
            <div className="route-wrap min-w-[220px] flex-1" role="group" aria-label="本书章节">
              {book.chapters.map((c, i) => (
                <Tooltip key={c.id}>
                  <TooltipTrigger
                    aria-label={`第 ${c.number} 章 ${c.title}`}
                    aria-current={c === chapter ? 'page' : undefined}
                    onClick={() => navigate(book, c)}
                    style={{ left: `${stopPct(i)}%` }}
                    className={cn(
                      'route-stop',
                      i < stopIndex && 'passed',
                      i === stopIndex && 'here',
                      keptChapters.has(c.id) && 'kept',
                    )}
                  />
                  <TooltipContent className="font-board text-sm">
                    {c.number}. {c.title}
                  </TooltipContent>
                </Tooltip>
              ))}
              <span className="route-here" style={{ left: `${stopPct(stopIndex)}%` }} aria-hidden="true" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                aria-label="语言"
                spacing={0}
                value={[prefs.mode]}
                onValueChange={(v) => {
                  const next = v[0] as LangMode | undefined
                  if (next) setPrefs({ ...prefs, mode: next })
                }}
                className="rounded-sm bg-ink-2 p-0.5"
              >
                {LANG_MODES.map(([m, label]) => (
                  <ToggleGroupItem key={m} value={m} className={switchItem}>
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>

              <div className="flex rounded-sm bg-ink-2 p-0.5" role="group" aria-label="字号">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="缩小字号"
                  disabled={prefs.fontSize <= 12}
                  onClick={() => setPrefs({ ...prefs, fontSize: Math.max(12, prefs.fontSize - 2) })}
                  className={switchItem}
                >
                  A−
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="放大字号"
                  disabled={prefs.fontSize >= 32}
                  onClick={() => setPrefs({ ...prefs, fontSize: Math.min(32, prefs.fontSize + 2) })}
                  className={switchItem}
                >
                  A+
                </Button>
              </div>

              <Toggle
                pressed={prefs.onlyFavorites}
                onPressedChange={(pressed) => setPrefs({ ...prefs, onlyFavorites: pressed })}
                title="突出已收藏的句子，未收藏的降低层次"
                className={cn(switchItem, 'bg-ink-2')}
              >
                <Bookmark className="size-3.5" />
                只看收藏
              </Toggle>
            </div>
          </div>
        </header>

        <div
          className="mx-auto box-content max-w-[66ch] px-6 pt-10 pb-16 font-read md:px-8"
          style={{ fontSize: prefs.fontSize }}
        >
          {ready && prefs.mode !== 'both' && (
            <p className="mb-6 font-board text-sm tracking-wide text-muted-foreground">
              单击一行，显示{prefs.mode === 'en' ? '中文' : '英文'}
            </p>
          )}
          {ready && expressEmpty && (
            <p className="mb-6 border-y border-ink py-3 font-board text-[15px] tracking-wide">本章还没有收藏的句子</p>
          )}
          {loading && <p className="font-board text-[15px] text-muted-foreground">加载中…</p>}
          {error && <p className="border-y border-destructive py-3 text-[15px] text-destructive">{error}</p>}

          <article
            ref={contentRef}
            className={cn('content', `mode-${prefs.mode}`, prefs.onlyFavorites && 'only-favorites')}
            style={{ display: ready ? undefined : 'none' }}
            onClick={onContentClick}
            dangerouslySetInnerHTML={{ __html: html }}
          />

          <nav className="mt-14 grid grid-cols-2 gap-4 border-t border-ink pt-4" aria-label="翻章">
            {neighbors.prev ? (
              <PagerLink
                dir="prev"
                label="上一章"
                title={neighbors.prev.chapter.title}
                onClick={() => navigate(neighbors.prev.book, neighbors.prev.chapter)}
              />
            ) : (
              <span />
            )}
            {neighbors.next && (
              <PagerLink
                dir="next"
                label="下一章"
                title={`${neighbors.next.book !== book ? `No. ${pad2(neighbors.next.book.number)} · ` : ''}${neighbors.next.chapter.title}`}
                onClick={() => navigate(neighbors.next.book, neighbors.next.chapter)}
              />
            )}
          </nav>
        </div>
      </main>
    </div>
  )
}

function PagerLink({
  dir,
  label,
  title,
  onClick,
}: {
  dir: 'prev' | 'next'
  label: string
  title: string
  onClick: () => void
}) {
  const Icon = dir === 'prev' ? ArrowLeft : ArrowRight
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col gap-1 rounded-sm px-2 py-2 transition-colors hover:bg-muted',
        dir === 'next' && 'col-start-2 items-end text-right',
      )}
    >
      <span className="flex items-center gap-1.5 font-board text-sm font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {dir === 'prev' && <Icon className="size-3.5 transition-transform group-hover:-translate-x-0.5" />}
        {label}
        {dir === 'next' && <Icon className="size-3.5 transition-transform group-hover:translate-x-0.5" />}
      </span>
      <span className="font-board text-xl leading-tight font-semibold">{title}</span>
    </button>
  )
}

/** A book title with the time phrase it already contains set as the departure time. */
function TitleWithTime({ title, time }: { title: string; time: string }) {
  const at = time ? title.toLowerCase().indexOf(time.toLowerCase()) : -1
  if (at < 0) return <span>{title}</span>
  return (
    <span>
      {title.slice(0, at)}
      <span className="time-phrase">{title.slice(at, at + time.length)}</span>
      {title.slice(at + time.length)}
    </span>
  )
}
