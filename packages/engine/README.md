# @tabletop-engine/engine

Nuxt-модуль движка настольной партии (JavaScript).

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

## useState — реестр ключей

Источник правды: `src/runtime/constants/` (импорт `@tabletop-engine/engine/constants`).

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

isMyTurn.value
relationTo(player.id) // 'self' | 'teammate' | 'enemy'
```

## Подключение

```js
export default defineNuxtConfig({
  modules: ['@tabletop-engine/engine'],
  tabletopEngine: { apiPrefix: '/api/tabletop' },
})
```

## Лобби → партия

```js
const game = useGameSetup()
const seats = usePlayerSetup()
const { createFromSetup } = useGameView()
const { isMyTurn } = useGameHelpers()

game.setMap({ id: 'map-1', nodes: [] })
seats.add({ id: '0', team: 'A', deck: [] })
seats.add({ id: '1', team: 'B', deck: [] })
await createFromSetup()
```

## API (Nitro)

| Метод | Путь |
|-------|------|
| POST | `{apiPrefix}/create` |
| POST | `{apiPrefix}/action` |
| GET | `{apiPrefix}/view?gameId=&playerId=` |
