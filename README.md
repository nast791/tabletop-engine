# tabletop-engine

pnpm-монорепозиторий пакетов для настольных партий (пакеты на JavaScript).

## Пакеты

| Пакет | Назначение |
|-------|------------|
| [`@tabletop-engine/engine`](packages/engine) | Nuxt-модуль: setup / view / helpers + STATE_KEYS |

## Скрипты

| Скрипт | Назначение |
|--------|------------|
| `pnpm changeset` | Зафиксировать намерение bump-версии |
| `pnpm version-packages` | Применить changesets, обновить версии и lockfile |
| `pnpm release` | Publish в npm |
| `pnpm release:dry` | Dry-run publish |

## Установка в Nuxt-проект

```bash
# после публикации в registry
pnpm dlx --package @tabletop-engine/engine tabletop-engine setup

# локальная связка при разработке монорепо
node /path/to/tabletop-engine/packages/engine/bin/tabletop-engine.mjs setup --link --cwd .
```

Скрипт:

1. Дописывает в `package.json` целевого проекта:
   - `tabletop-engine:setup`
   - `tabletop-engine:update`
   - `tabletop-engine:update:engine`
2. Ставит `@tabletop-engine/engine` (+ peer `nuxt` и runtime-зависимости) через pnpm
3. Обновляет pnpm-lock.yaml

Затем в `nuxt.config`:

```js
export default defineNuxtConfig({
  modules: ['@tabletop-engine/engine'],
})
```

Обновление:

```bash
pnpm tabletop-engine:update
# или
pnpm tabletop-engine:update:engine
```

## Релиз

1. `pnpm changeset` — описать изменение
2. Влить в `master`
3. `pnpm version-packages` — версии + changelog + lockfile
4. Закоммитить bump
5. `pnpm release` — publish (нужен `NPM_TOKEN` / npm login)
