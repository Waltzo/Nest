import type { DashboardConfig } from '../types'

// The repo that hosts this dashboard. Publish writes dashboard.json here.
const OWNER = 'Waltzo'
const REPO = 'Nest'
const PATH = 'public/dashboard.json'
const BRANCH = 'main'

const TOKEN_KEY = 'nest.github.pat'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token.trim())
  } catch {
    /* ignore */
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

// base64-encode UTF-8 (btoa alone breaks on non-Latin1, e.g. 서울/한글).
function toBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

async function getCurrentSha(token: string): Promise<string | undefined> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}?ref=${BRANCH}`,
    {
      // no-store: avoid the browser HTTP cache returning a stale sha, which
      // would make the PUT below fail with a 409 sha-mismatch conflict.
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    },
  )
  if (res.status === 404) return undefined // file not yet committed
  if (!res.ok) throw new Error(`SHA lookup failed: HTTP ${res.status}`)
  const data = await res.json()
  return data.sha as string
}

// Commit the given config to public/dashboard.json via the GitHub Contents API.
// The PAT is the real write gate — only the token holder can publish.
export async function publishToGitHub(
  config: DashboardConfig,
  token: string,
): Promise<{ commitUrl: string }> {
  const content = toBase64Utf8(JSON.stringify(config, null, 2))

  const putOnce = async (sha: string | undefined) =>
    fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'chore(nest): update dashboard config',
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
    })

  let res = await putOnce(await getCurrentSha(token))
  // 409 = sha mismatch (file changed since our lookup). Re-fetch the current
  // sha and retry once.
  if (res.status === 409) {
    res = await putOnce(await getCurrentSha(token))
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      if (err?.message) detail = err.message
    } catch {
      /* ignore parse error */
    }
    throw new Error(`Publish failed: ${detail}`)
  }
  const data = await res.json()
  return { commitUrl: data.commit?.html_url ?? '' }
}
