export interface FavoriteSentence {
  sid: string
  bookId: string
  chapterId: string
  enText: string
  zhText: string
  createdAt: number
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${path} failed: ${res.status} ${text}`)
  }
  return res.json() as Promise<T>
}

/** Warm up / verify local API is reachable. */
export async function getDb(): Promise<void> {
  await api<{ ok: boolean }>('/api/health')
}

export async function listFavoriteSids(): Promise<Set<string>> {
  const sids = await api<string[]>('/api/favorites/sids')
  return new Set(sids)
}

export async function toggleSentenceFavorite(input: {
  sid: string
  bookId: string
  chapterId: string
  enText: string
  zhText: string
}): Promise<boolean> {
  const res = await api<{ favorited: boolean }>('/api/favorites/sentences/toggle', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return res.favorited
}

export async function listFavoriteSentences(): Promise<FavoriteSentence[]> {
  return api('/api/favorites/sentences')
}
