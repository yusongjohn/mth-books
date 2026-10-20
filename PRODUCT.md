# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One adult reader (the repository owner) learning English by reading the Magic Tree House series. Reads at a desktop computer, seated, in long sessions.

## Product Purpose

A local, personal bilingual reader for 55 Magic Tree House books (570 chapters) stored as en/zh HTML chapter files in this repository. Success is long, immersive English reading where Chinese is a fallback consulted only when stuck, and good sentences can be kept for later review.

## Positioning

Not a reading app or a course: a private desk copy of one specific series, built around reading English first and keeping the sentences worth returning to.

## Operating Context

- Runs locally: Vite dev server on 127.0.0.1:5173, Express + SQLite API on 127.0.0.1:8787, started with `npm run dev` in `viewer/`.
- Favorites live in a local SQLite file and are exported to `favorites.json` (committed to git) on push.
- Chapter HTML is the source of truth; each English sentence is a `.en .cue[data-sid]`, paired with `.zh .cue` by `data-start` inside `p.line`.

## Capabilities and Constraints

- Navigate books and chapters (sidebar, prev/next, arrow keys, URL hash).
- Language modes: 中英 (both), 英文 (English only, click a line to reveal Chinese), 中文.
- Font size A-/A+.
- Sentence favorites: star after each sentence; favorites list in the sidebar jumps to the sentence.
- 只看收藏: only favorited sentences stay highlighted; everything else is dimmed and disabled.
- Word/phrase favorites were deliberately removed; the product cares about sentences only.
- Chapter HTML is sanitized with DOMPurify before rendering; UI copy is Chinese.

## Evidence on Hand

- Chapter text and illustrations in `NN-slug/chapters/NN-slug/` folders (some images missing; the viewer hides broken figures).
- No cover art, logo, or brand assets beyond the series content itself.

## Product Principles

1. English first: the English text is the page; Chinese assists and never competes.
2. Long sessions at a desk: comfort and stamina over novelty.
3. Sentences are the unit of value: keeping and revisiting a sentence must be effortless.
4. Local and private: no accounts, no network services, data in the repo.
