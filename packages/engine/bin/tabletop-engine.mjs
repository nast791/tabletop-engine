#!/usr/bin/env node
/**
 * CLI для установки пакетов @tabletop-engine/* в целевой проект.
 *
 *   pnpm dlx --package @tabletop-engine/engine tabletop-engine setup
 *   pnpm exec tabletop-engine update
 *   pnpm exec tabletop-engine update engine
 *
 * Пишет скрипты в package.json, ставит пакет (+ peers / runtime-зависимости)
 * и обновляет pnpm-lock.yaml.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_ROOT = resolve(__dirname, '..')
const THIS_PKG = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'))

// Каталог публикуемых пакетов (расширять по мере роста монорепо).
const CATALOG = {
  engine: {
    name: '@tabletop-engine/engine',
    scriptKey: 'tabletop-engine:update:engine',
  },
}

const SCRIPT_UPDATE_ALL = 'tabletop-engine:update'
const SCRIPT_SETUP = 'tabletop-engine:setup'

const usage = () => {
  console.log(`Использование:
  tabletop-engine setup [--cwd <dir>] [--link] [--registry <url>] [пакеты...]
  tabletop-engine update [--cwd <dir>] [--registry <url>] [пакеты...]

Пакеты (по умолчанию: engine): ${Object.keys(CATALOG).join(', ')}

Опции:
  --cwd <dir>       Корень целевого проекта (по умолчанию: cwd)
  --link            Установить из локальной папки пакета (file:), не из registry
  --registry <url>  npm-registry для pnpm add
`)
}

const parseArgs = (argv) => {
  const out = {
    command: undefined,
    cwd: process.cwd(),
    link: false,
    registry: undefined,
    packages: [],
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '-h' || arg === '--help') {
      out.command = 'help'
      continue
    }
    if (arg === '--cwd') {
      out.cwd = resolve(argv[++i] ?? '')
      continue
    }
    if (arg === '--link') {
      out.link = true
      continue
    }
    if (arg === '--registry') {
      out.registry = argv[++i]
      continue
    }
    if (arg.startsWith('-')) {
      throw new Error(`Неизвестная опция: ${arg}`)
    }
    if (!out.command) {
      out.command = arg
      continue
    }
    out.packages.push(arg)
  }

  if (out.packages.length === 0) {
    out.packages = ['engine']
  }

  return out
}

const resolveCatalogEntries = (keys) =>
  keys.map((key) => {
    const entry = CATALOG[key]
    if (!entry) {
      throw new Error(
        `Неизвестный пакет "${key}". Доступны: ${Object.keys(CATALOG).join(', ')}`,
      )
    }
    return { key, ...entry }
  })

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'))

const writeJson = (path, data) => {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

const ensurePnpm = (cwd) => {
  const result = spawnSync('pnpm', ['--version'], {
    cwd,
    encoding: 'utf8',
    shell: true,
  })
  if (result.status !== 0) {
    throw new Error('В целевом проекте нужен pnpm (https://pnpm.io/installation)')
  }
}

const runPnpm = (cwd, args, { registry } = {}) => {
  const env = { ...process.env }
  if (registry) {
    env.npm_config_registry = registry
  }
  const result = spawnSync('pnpm', args, {
    cwd,
    env,
    encoding: 'utf8',
    shell: true,
    stdio: 'inherit',
  })
  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(' ')} завершился с ошибкой`)
  }
}

const ensureScripts = (pkgPath, entries) => {
  const pkg = readJson(pkgPath)
  pkg.scripts ??= {}

  let changed = false
  const setScript = (key, value) => {
    if (pkg.scripts[key] !== value) {
      pkg.scripts[key] = value
      changed = true
    }
  }

  setScript(SCRIPT_SETUP, 'tabletop-engine setup')
  setScript(SCRIPT_UPDATE_ALL, 'tabletop-engine update')
  for (const entry of entries) {
    setScript(entry.scriptKey, `tabletop-engine update ${entry.key}`)
  }

  if (changed) {
    writeJson(pkgPath, pkg)
    console.log(`Скрипты обновлены в ${pkgPath}`)
  }
}

const packageSpec = (entry, { link }) => {
  if (link) {
    if (entry.name !== THIS_PKG.name) {
      throw new Error(
        `--link сейчас поддерживает только ${THIS_PKG.name} из bin этого пакета`,
      )
    }
    return `${entry.name}@file:${PKG_ROOT}`
  }
  return `${entry.name}@latest`
}

const collectInstallSpecs = (targetCwd, packageName) => {
  const require = createRequire(join(targetCwd, 'package.json'))
  let resolvedPkg
  try {
    const pkgJsonPath = require.resolve(`${packageName}/package.json`)
    resolvedPkg = readJson(pkgJsonPath)
  } catch {
    return []
  }

  const specs = []
  const peer = resolvedPkg.peerDependencies ?? {}
  const peerMeta = resolvedPkg.peerDependenciesMeta ?? {}
  for (const [name, range] of Object.entries(peer)) {
    if (peerMeta[name]?.optional) continue
    specs.push(`${name}@${range}`)
  }

  // Runtime-зависимости тоже ставим в целевой проект → package.json + lockfile.
  for (const [name, range] of Object.entries(resolvedPkg.dependencies ?? {})) {
    specs.push(`${name}@${range}`)
  }

  return specs
}

const installPackages = (cwd, entries, { link, registry }) => {
  const specs = entries.map((entry) => packageSpec(entry, { link }))
  console.log(`Установка: ${specs.join(', ')}`)
  runPnpm(cwd, ['add', ...specs], { registry })

  const depSpecs = new Set()
  for (const entry of entries) {
    for (const spec of collectInstallSpecs(cwd, entry.name)) {
      depSpecs.add(spec)
    }
  }

  if (depSpecs.size > 0) {
    console.log(`Установка зависимостей пакета в проект: ${[...depSpecs].join(', ')}`)
    runPnpm(cwd, ['add', ...depSpecs], { registry })
  }

  runPnpm(cwd, ['install'], { registry })
}

const updatePackages = (cwd, entries, { registry }) => {
  const names = entries.map((e) => e.name)
  console.log(`Обновление: ${names.join(', ')}`)
  runPnpm(cwd, ['update', ...names], { registry })

  const depSpecs = new Set()
  for (const entry of entries) {
    for (const spec of collectInstallSpecs(cwd, entry.name)) {
      depSpecs.add(spec)
    }
  }

  if (depSpecs.size > 0) {
    console.log(`Обновление зависимостей пакета в проекте: ${[...depSpecs].join(', ')}`)
    runPnpm(cwd, ['add', ...depSpecs], { registry })
  }

  runPnpm(cwd, ['install'], { registry })
}

const main = () => {
  const args = parseArgs(process.argv.slice(2))
  if (!args.command || args.command === 'help') {
    usage()
    process.exit(args.command ? 0 : 1)
  }

  if (args.command !== 'setup' && args.command !== 'update') {
    usage()
    throw new Error(`Неизвестная команда: ${args.command}`)
  }

  const pkgPath = join(args.cwd, 'package.json')
  if (!existsSync(pkgPath)) {
    throw new Error(`Нет package.json в ${pkgPath}`)
  }

  ensurePnpm(args.cwd)
  const entries = resolveCatalogEntries(args.packages)

  if (args.command === 'setup') {
    ensureScripts(pkgPath, entries)
    installPackages(args.cwd, entries, args)
    console.log('Установка завершена.')
    console.log(
      "Добавьте модуль в nuxt.config: modules: ['@tabletop-engine/engine']",
    )
    return
  }

  ensureScripts(pkgPath, entries)
  updatePackages(args.cwd, entries, args)
  console.log('Обновление завершено.')
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
