import { getSteps, normalizeCardTriggers } from './cardTriggers.js'
import { runSteps } from './runSteps.js'

/**
 * Движок карт: реестр эффектов + resolve по триггеру.
 * State партии не хранит — только интерпретирует описания карт.
 *
 * @param {{ effects?: Record<string, (ctx, payload) => unknown> }} [options]
 */
export const createCardEngine = (options = {}) => {
  const effects = { ...(options.effects ?? {}) }

  const register = (type, fn) => {
    if (type == null || type === '') {
      throw new Error('cards: register(type, fn) — type обязателен')
    }
    if (typeof fn !== 'function') {
      throw new Error(`cards: register("${type}") — fn должен быть функцией`)
    }
    effects[String(type)] = fn
    return api
  }

  const registerMany = (map = {}) => {
    for (const [type, fn] of Object.entries(map)) {
      register(type, fn)
    }
    return api
  }

  /**
   * Выполнить эффекты карты на триггере.
   * @param {object} card
   * @param {string} trigger — TRIGGERS.* или своя строка
   * @param {object} [ctx] — opaque: state, player, api, facts, …
   */
  const resolve = (card, trigger, ctx = {}) => {
    if (trigger == null || trigger === '') {
      throw new Error('cards: resolve — trigger обязателен')
    }
    const steps = getSteps(card, trigger)
    if (steps.length === 0) return ctx
    return runSteps(steps, ctx, effects)
  }

  const listEffects = () => Object.keys(effects)

  const api = {
    register,
    registerMany,
    resolve,
    getSteps,
    normalizeCardTriggers,
    runSteps: (steps, ctx) => runSteps(steps, ctx, effects),
    listEffects,
  }

  return api
}
