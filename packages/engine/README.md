# @nast791/engine

Nuxt-модуль движка настольной партии (JavaScript). Публикация: **GitHub Packages**.

## Установка в проект

CLI сам допишет `.npmrc` в целевом проекте (`@nast791:registry=…`).  
Токен auth — только в `%USERPROFILE%\.npmrc` (`read:packages`).

```bash
pnpm add @nast791/engine
# или
pnpm dlx --package @nast791/engine tabletop-engine setup
```
```js
export default defineNuxtConfig({
  modules: ['@nast791/engine'],
  tabletopEngine: { apiPrefix: '/api/tabletop' },
})
```

## Composables

### Внешние (автоимпорт)

| Composable | Назначение |
|------------|------------|
| `useGameSetup` | настройки партии: map, rules, options, visibility |
| `usePlayerSetup` | слоты игроков: герой, team, deck… |
| `useGameView` | живая партия: `view` / `gameId` + create / action |
| `useGameHelpers` | computed: `isMyTurn`, `relationTo`, `me`, … |

### Внутренние (без автоимпорта)

`useCreateGame`, `useApply`, `useGetView`, `useZoneVisibility`, `useNormalizeGameSetup`, `useNormalizePlayerSetup`, `useBuildGameConfig`, `usePartyStore`, `useGameApi`, `useConfigError`, `useGameIdentity`

## Константы

`src/runtime/constants/` → `@nast791/engine/constants`

| Файл | Содержимое |
|------|------------|
| `stateKeys.js` | ключи `useState` |
| `visibility.js` | `DEFAULT_VISIBILITY`, зоны, relations |
| `rules.js` | `DEFAULT_RULES` |

### useState — ключи

| Ключ | Хранит | Кто пишет |
|------|--------|-----------|
| `tabletop-engine:view` | view текущего игрока | `useGameView` |
| `tabletop-engine:playerId` | локальный playerId | `useGameView` |
| `tabletop-engine:gameId` | id партии | `useGameView` |
| `tabletop-engine:setup:id` | id после create | `useGameSetup` / create |
| `tabletop-engine:setup:map` | карта лобби | `useGameSetup` |
| `tabletop-engine:setup:rules` | rules + visibility | `useGameSetup` |
| `tabletop-engine:setup:options` | options без seed | `useGameSetup` |
| `tabletop-engine:setup:players` | слоты игроков | `usePlayerSetup` |

## Id и seed

- **id** — на сервере, в проект: `view.id` / `gameId` / `useGameSetup().id`
- **seed** — только серверный `state.options.seed`, в view не отдаётся

## Видимость зон

`rules.visibility`: **self / teammate / enemy** × **hand / deck / discard** × `{ cards, count }`.

## Хелперы

```js
const { isMyTurn, me, currentPlayer, relationTo, isEnemy, myHeroes } = useGameHelpers()
```

## Лобби → партия

```js
const game = useGameSetup()
const seats = usePlayerSetup()
const { createFromSetup } = useGameView()

game.setMap({ id: 'map-1', nodes: [] })
seats.add({ id: '0', team: 'A', deck: [] })
await createFromSetup()
```

## API (Nitro)

| Метод | Путь |
|-------|------|
| POST | `{apiPrefix}/create` |
| POST | `{apiPrefix}/action` |
| GET | `{apiPrefix}/view?gameId=&playerId=` |

## Публикация (maintainers)

```bash
# PAT classic: write:packages, read:packages, repo
$env:GITHUB_TOKEN = "ghp_…"   # PowerShell
pnpm release
```
