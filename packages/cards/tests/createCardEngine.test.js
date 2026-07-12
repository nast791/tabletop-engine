import { describe, expect, it } from 'vitest'
import {
  createCardEngine,
  getSteps,
  matchWhen,
  normalizeCardTriggers,
  runSteps,
} from '../src/runtime/core/index.js'
import { TRIGGERS, CARD_TYPES } from '../src/runtime/constants/index.js'

describe('createCardEngine', () => {
  it('resolve: events → onPlay', () => {
    const cards = createCardEngine({
      effects: {
        DRAW_CARDS: (ctx, { count = 1 }) => ({
          ...ctx,
          drawn: (ctx.drawn || 0) + count,
        }),
      },
    })

    const ctx = cards.resolve(
      { id: 'plan', events: [{ type: 'DRAW_CARDS', count: 2 }] },
      TRIGGERS.onPlay,
      { drawn: 0 },
    )

    expect(ctx.drawn).toBe(2)
  })

  it('resolve: when пропускает шаги', () => {
    const cards = createCardEngine({
      effects: {
        BONUS: (ctx, { amount }) => ({ ...ctx, bonus: amount }),
        SKIP: (ctx) => ({ ...ctx, skipped: true }),
      },
    })

    const card = {
      triggers: {
        onPlay: [
          { type: 'BONUS', amount: 3, when: { role: 'attacker' } },
          { type: 'SKIP', when: { role: 'defender' } },
        ],
      },
    }

    const atk = cards.resolve(card, TRIGGERS.onPlay, {
      facts: { role: 'attacker' },
    })
    expect(atk.bonus).toBe(3)
    expect(atk.skipped).toBeUndefined()

    const def = cards.resolve(card, TRIGGERS.onPlay, {
      facts: { role: 'defender' },
    })
    expect(def.skipped).toBe(true)
    expect(def.bonus).toBeUndefined()
  })

  it('resolve: onAttack из triggers', () => {
    const cards = createCardEngine({
      effects: {
        BONUS: (ctx, { amount }) => ({ ...ctx, bonus: amount }),
      },
    })

    const ctx = cards.resolve(
      { triggers: { onAttack: [{ type: 'BONUS', amount: 1 }] } },
      TRIGGERS.onAttack,
      {},
    )
    expect(ctx.bonus).toBe(1)
  })

  it('неизвестный effect → Error', () => {
    const cards = createCardEngine()
    expect(() =>
      cards.resolve({ events: [{ type: 'NOPE' }] }, TRIGGERS.onPlay, {}),
    ).toThrow(/неизвестный effect/)
  })

  it('register / listEffects', () => {
    const cards = createCardEngine()
    cards.register('X', (ctx) => ctx)
    expect(cards.listEffects()).toContain('X')
  })
})

describe('getSteps / normalizeCardTriggers', () => {
  it('getSteps: legacy events', () => {
    const steps = getSteps(
      { events: [{ type: 'A' }] },
      TRIGGERS.onPlay,
    )
    expect(steps).toEqual([{ type: 'A' }])
  })

  it('normalizeCardTriggers', () => {
    const n = normalizeCardTriggers({
      id: 'c',
      events: [{ type: 'A' }],
    })
    expect(n.triggers.onPlay).toEqual([{ type: 'A' }])
  })
})

describe('matchWhen / runSteps', () => {
  it('matchWhen: object и function', () => {
    expect(matchWhen({ a: 1 }, { facts: { a: 1 } })).toBe(true)
    expect(matchWhen({ a: 1 }, { facts: { a: 2 } })).toBe(false)
    expect(matchWhen((ctx) => ctx.ok === true, { ok: true })).toBe(true)
  })

  it('runSteps без карты', () => {
    const ctx = runSteps(
      [{ type: 'ADD', n: 2 }],
      { sum: 0 },
      {
        ADD: (c, { n }) => ({ ...c, sum: c.sum + n }),
      },
    )
    expect(ctx.sum).toBe(2)
  })

  it('runSteps: pause → remainingSteps + wait', () => {
    const ctx = runSteps(
      [{ type: 'ASK' }, { type: 'ADD', n: 5 }],
      { sum: 0 },
      {
        ASK: c => ({ ...c, pause: true, wait: { kind: 'PROMPT' }, asked: true }),
        ADD: (c, { n }) => ({ ...c, sum: c.sum + n }),
      },
    )
    expect(ctx.asked).toBe(true)
    expect(ctx.pause).toBe(false)
    expect(ctx.wait.kind).toBe('PROMPT')
    expect(ctx.remainingSteps).toEqual([{ type: 'ADD', n: 5 }])
    expect(ctx.sum).toBe(0)
  })
})

describe('constants', () => {
  it('TRIGGERS и CARD_TYPES', () => {
    expect(TRIGGERS.onPlay).toBe('onPlay')
    expect(CARD_TYPES.effect).toBe('effect')
  })
})
