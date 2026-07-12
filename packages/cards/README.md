# @nast791/cards

Nuxt-модуль интерпретатора карт (JavaScript).  
**Без UI, без хранения партии** — триггеры → шаги эффектов.

Публикация: **GitHub Packages** (`@nast791`).

## Структура

```
src/
  module.js
  runtime/
    composables/   # useCardEngine (автоимпорт)
    constants/     # TRIGGERS, CARD_TYPES
    core/          # createCardEngine, runSteps, when
    server/        # getCardEngine + #tabletop-card-effects
    internal/      # emptyHostEffects
```

## Установка

```bash
pnpm add @nast791/cards
```

```js
// nuxt.config
export default defineNuxtConfig({
  modules: ['@nast791/engine', '@nast791/cards'],
  tabletopCards: {
    effects: '#shared/cardEffects.js', // реестр эффектов хоста
  },
})
```

## Идея

| Слой | Роль |
|------|------|
| `@nast791/engine` | партия, фазы, apply / view |
| **`@nast791/cards`** | описание карты → `resolve(trigger)` |
| хост | контент + handlers эффектов (`DRAW_CARDS`, …) |

## Реестр эффектов хоста

`tabletopCards.effects` → alias `#tabletop-card-effects`.

```js
// shared/cardEffects.js
export default {
  DRAW_CARDS: (ctx, { count = 1 }) => {
    // ctx.state / ctx.player — договорённость хоста
    return ctx
  },
}
```

Или `{ effects: { … } }` — оба формата ок.

## Использование

```js
// в host action (сервер) или через автоимпорт
const cards = useCardEngine()
// либо: import { getCardEngine } from '@nast791/cards/server'

cards.resolve(card, 'onPlay', { state, player, api })
```

Константы: `@nast791/cards/constants` → `TRIGGERS`, `CARD_TYPES`.  
Чистое ядро без Nuxt: `@nast791/cards/core` → `createCardEngine`.

## Форма карты

```js
{
  id: 'alpha_plan',
  type: 'effect',
  triggers: {
    onPlay: [
      { type: 'DRAW_CARDS', count: 1 },
      { type: 'DEAL_DAMAGE', damage: 2, when: { role: 'attacker' } },
    ],
  },
}
```

`events: […]` без `triggers` = шаги для `onPlay`.

Шаг: `type` + payload + опциональный `when` (object | `(ctx) => boolean`).

## API движка

| Метод | Назначение |
|-------|------------|
| `resolve(card, trigger, ctx)` | прогнать шаги триггера |
| `register` / `registerMany` | доп. эффекты в runtime |
| `getSteps` / `runSteps` | низкий уровень |
| `listEffects()` | зарегистрированные type |

Контракт эффекта: `(ctx, payload) => ctx | void`.

`TRIGGERS`: `onPlay`, `onAttack`, `onDefend`, `onMove`, `onMoveConfirm`, `onTurnStart`, `onTurnEnd`, `onDiscard`.

Примитивы вроде `DEAL_DAMAGE` / `CHECK_WINNER` остаются в игре.
