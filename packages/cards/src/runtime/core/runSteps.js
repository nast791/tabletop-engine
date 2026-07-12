import { matchWhen } from './matchWhen.js'

/**
 * Прогнать шаги эффектов.
 * Handler: (ctx, payload) => ctx | void
 * ctx.pause === true → стоп; remainingSteps = хвост; wait сохраняется.
 */
export const runSteps = (steps, ctx, effects = {}) => {
  let next = ctx

  for (let i = 0; i < (steps ?? []).length; i += 1) {
    const step = steps[i]
    if (!step || typeof step !== 'object') {
      throw new Error('cards: шаг эффекта должен быть объектом')
    }

    const { type, when, ...payload } = step
    if (type == null || type === '') {
      throw new Error('cards: у шага обязателен type')
    }

    if (!matchWhen(when, next)) continue

    const fn = effects[type]
    if (typeof fn !== 'function') {
      throw new Error(`cards: неизвестный effect "${type}"`)
    }

    const result = fn(next, payload)
    if (result !== undefined) next = result

    if (next?.pause === true) {
      return {
        ...next,
        pause: false,
        remainingSteps: steps.slice(i + 1),
      }
    }
  }

  return next
}
