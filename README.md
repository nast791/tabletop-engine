# tabletop-engine

pnpm-монорепозиторий пакетов для настольных партий (пакеты на JavaScript).

Публикация пакетов: **GitHub Packages** (`https://npm.pkg.github.com`), scope `@nast791`.

## Пакеты

| Пакет | Назначение |
|-------|------------|
| [`@nast791/engine`](packages/engine) | Nuxt-модуль: setup / view / helpers + STATE_KEYS |

## Скрипты

| Скрипт | Назначение |
|--------|------------|
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

1. Classic PAT GitHub: `write:packages`, `read:packages`, `repo`
2. `GITHUB_TOKEN=ghp_…` в окружении (не коммитить токен)
3. `pnpm changeset` → merge → `pnpm version-packages` → commit
4. `pnpm release`

Репозиторий должен быть на GitHub под user/org `nast791` (совпадает со scope пакета).
