// Minimal GitHub REST helper for the scheduled jobs (uses the workflow's GITHUB_TOKEN).

export const hasGitHub = () => Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY)

export async function gh(method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`GitHub ${method} ${path}: HTTP ${res.status} ${await res.text()}`)
  return res.status === 204 ? null : res.json()
}

export async function ensureLabel(name, color, description) {
  try { await gh('POST', '/labels', { name, color, description }) }
  catch (e) { if (!/HTTP 422/.test(e.message)) throw e }   // 422 = already exists
}
