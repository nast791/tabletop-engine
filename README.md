# tabletop-engine

pnpm-монорепозиторий пакетов для настольных партий (пакеты на JavaScript).

Публикация пакетов: **GitHub Packages** (`https://npm.pkg.github.com`), scope `@nast791`.

## Пакеты

| Пакет | Назначение |
|-------|------------|
| [`@nast791/engine`](packages/engine) | Nuxt-модуль: setup / view / helpers + STATE_KEYS |
| [`@nast791/cards`](packages/cards) | Nuxt-модуль: триггеры карт → эффекты хоста |

## Скрипты

| Скрипт | Назначение |
|--------|------------|
| `pnpm test` | Vitest во всех `@nast791/*` |
| `pnpm changeset` | Зафиксировать намерение bump-версии |
| `pnpm version-packages` | Применить changesets, обновить версии и lockfile |
| `pnpm release` | Publish в GitHub Packages |
| `pnpm release:dry` | Dry-run publish |

## Установка в Nuxt-проект

В `.npmrc` целевого проекта (или через CLI `tabletop-engine setup` — создаст сам):

```ini
@nast791:registry=https://npm.pkg.github.com
```

Токен — только в `%USERPROFILE%\.npmrc`, не в проекте.
```bash
pnpm add @nast791/engine
# или CLI
pnpm dlx --package @nast791/engine tabletop-engine setup
```

В `nuxt.config`:

```js
export default defineNuxtConfig({
  modules: ['@nast791/engine'],
})
```

Локальная связка при разработке:

```bash
node packages/engine/bin/tabletop-engine.mjs setup --link --cwd ../YourApp
```

## Релиз

1. Classic PAT: `write:packages`, `read:packages`, `repo` (в `%USERPROFILE%\.npmrc`)
2. `pnpm changeset` → merge → `pnpm version-packages` → commit → push
3. `pnpm release` — publish в GitHub Packages **и** GitHub Release с текстом из CHANGELOG (changeset)

Описание версии на GitHub («About this version») берётся из **Release notes**, не из npm-метаданных.  
После первой публикации на странице пакета нажмите **Connect repository** → `nast791/tabletop-engine` — подтянется README репозитория.

Дописать notes к уже опубликованным версиям:

```powershell
pnpm release:notes
```
