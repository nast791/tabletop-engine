/**
 * Создаёт GitHub Release для опубликованных пакетов.
 * Текст берётся из CHANGELOG.md (секция текущей версии = changeset).
 *
 * Нужен токен: GITHUB_TOKEN или auth в %USERPROFILE%\.npmrc
 * (classic PAT: repo + write:packages).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const ROOT = process.cwd()
const OWNER = 'nast791'
const REPO = 'tabletop-engine'

const readToken = () => {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim()
  if (process.env.GH_TOKEN) return process.env.GH_TOKEN.trim()

  const npmrcPath = join(homedir(), '.npmrc')
  if (!existsSync(npmrcPath)) return null
  const text = readFileSync(npmrcPath, 'utf8')
  const match = text.match(
    /\/\/npm\.pkg\.github\.com\/:_authToken=(.+)/,
  )
  return match?.[1]?.trim() || null
}

const extractChangelogSection = (changelog, version) => {
  const heading = `## ${version}`
  const start = changelog.indexOf(heading)
  if (start === -1) return null

  const after = changelog.slice(start + heading.length)
  const next = after.search(/\n## [^#]/)
  const body = (next === -1 ? after : after.slice(0, next)).trim()
  return body || null
}

const listPublishablePackages = () => {
  const packagesDir = join(ROOT, 'packages')
  if (!existsSync(packagesDir)) return []

  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const dir = join(packagesDir, d.name)
      const pkgPath = join(dir, 'package.json')
      const changelogPath = join(dir, 'CHANGELOG.md')
      if (!existsSync(pkgPath) || !existsSync(changelogPath)) return null
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
      if (pkg.private) return null
      return {
        name: pkg.name,
        version: pkg.version,
        changelog: readFileSync(changelogPath, 'utf8'),
      }
    })
    .filter(Boolean)
}

const githubRequest = async (token, method, path, body) => {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'tabletop-engine-release',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  return { ok: res.ok, status: res.status, data }
}

const ensureRelease = async (token, pkg) => {
  const tag = `${pkg.name}@${pkg.version}`
  const notes = extractChangelogSection(pkg.changelog, pkg.version)
  if (!notes) {
    console.warn(`нет секции ## ${pkg.version} в CHANGELOG для ${pkg.name}`)
    return
  }

  const encodedTag = encodeURIComponent(tag)
  const existing = await githubRequest(
    token,
    'GET',
    `/repos/${OWNER}/${REPO}/releases/tags/${encodedTag}`,
  )
  if (existing.ok) {
    console.log(`Release уже есть: ${tag}`)
    return
  }
  if (existing.status !== 404) {
    throw new Error(
      `не удалось проверить release ${tag}: ${existing.status} ${JSON.stringify(existing.data)}`,
    )
  }

  const created = await githubRequest(
    token,
    'POST',
    `/repos/${OWNER}/${REPO}/releases`,
    {
      tag_name: tag,
      name: tag,
      body: notes,
      draft: false,
      prerelease: false,
    },
  )

  if (!created.ok) {
    throw new Error(
      `не удалось создать release ${tag}: ${created.status} ${JSON.stringify(created.data)}`,
    )
  }

  console.log(`Release создан: ${tag}`)
  console.log(created.data.html_url)
}

const main = async () => {
  const token = readToken()
  if (!token) {
    throw new Error(
      'Нет GITHUB_TOKEN / GH_TOKEN и нет _authToken в %USERPROFILE%\\.npmrc',
    )
  }

  const packages = listPublishablePackages()
  if (packages.length === 0) {
    console.log('Нет пакетов с CHANGELOG — пропуск')
    return
  }

  for (const pkg of packages) {
    await ensureRelease(token, pkg)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
