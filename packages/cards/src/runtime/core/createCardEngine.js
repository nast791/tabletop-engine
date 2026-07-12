import { getSteps, normalizeCardTriggers } from './cardTriggers.js'
import { runSteps } from './runSteps.js'
import {
  attachPrompt,
  collectMomentSources,
  listEffects,
  resolveDocEffects,
} from './resolveEffects.js'
import { evaluateTriggers, triggersNeedAnswer } from './evaluateTriggers.js'

/**
 * Движок карт/скиллов: эффекты + факты + moment/resume.
 *
 * @param {{
 *   effects?: Record<string, Function>,
 *   facts?: Record<string, Function>,
 * }} [options]
 */
export const createCardEngine = (options = {}) => {
  const effects = { ...(options.effects ?? {}) }
  const facts = { ...(options.facts ?? {}) }

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

  const registerFact = (name, fn) => {
    if (name == null || name === '') {
      throw new Error('cards: registerFact(name, fn) — name обязателен')
    }
    if (typeof fn !== 'function') {
      throw new Error(`cards: registerFact("${name}") — fn должен быть функцией`)
    }
    facts[String(name)] = fn
    return api
  }

  const registerFacts = (map = {}) => {
    for (const [name, fn] of Object.entries(map)) {
      registerFact(name, fn)
    }
    return api
  }

  /**
   * Классический resolve карты: triggers[trigger] | events→onPlay.
   */
  const resolve = (card, trigger, ctx = {}) => {
    if (trigger == null || trigger === '') {
      throw new Error('cards: resolve — trigger обязателен')
    }
    const steps = getSteps(card, trigger)
    if (steps.length === 0) return ctx
    return runSteps(steps, ctx, effects)
  }

  const runBound = (steps, ctx) => {
    let next = runSteps(steps ?? [], ctx, effects)
    next = attachPrompt(next, {
      doc: ctx.doc,
      kind: ctx.sourceKind,
      effectId: ctx.effectId,
    })
    return next
  }

  /**
   * Вход в фазу: state.phase → сверка triggers (fact PHASE) → events.
   * Имя фазы не передаётся снаружи — берётся из state.
   */
  const dispatch = (state, { api } = {}) => {
    if (state && typeof state === 'object') {
      state.effectPrompt = null
    }
    const phase = state?.phase
    let ctx = { state, api, phase, moment: phase, vars: {} }
    const sources = collectMomentSources(state, phase)

    for (const { doc, player, kind } of sources) {
      ctx = {
        ...ctx,
        state: ctx.state,
        player,
        doc,
        sourceKind: kind,
        phase,
        moment: phase,
      }
      ctx = resolveDocEffects(doc, ctx, {
        effects,
        facts,
        mode: 'phase',
        kind,
      })
      if (ctx.state?.effectPrompt) return ctx.state
    }
    return ctx.state
  }

  /** @deprecated используйте dispatch */
  const dispatchMoment = (state, _moment, opts) => dispatch(state, opts)

  /**
   * Ответ на effectPrompt (answer / targetId).
   */
  const resume = (state, action = {}, { api } = {}) => {
    const prompt = state?.effectPrompt
    if (!prompt) {
      throw new Error('cards: resume — нет effectPrompt')
    }
    if (String(action.playerId) !== String(prompt.playerId)) {
      throw new Error(
        `cards: resume ждёт игрока ${prompt.playerId}, пришёл ${action.playerId}`,
      )
    }

    const player = (state.players ?? []).find(
      p => String(p.id) === String(action.playerId),
    )
    const doc =
      prompt.sourceKind === 'skill'
        ? player?.skill
        : prompt.doc ?? player?.skill

    const kind = prompt.kind
    let ctx = {
      state,
      player,
      api,
      moment: prompt.moment ?? prompt.phase ?? state.phase,
      phase: prompt.phase ?? prompt.moment ?? state.phase,
      vars: { ...(prompt.vars ?? {}) },
      doc,
      sourceKind: prompt.sourceKind,
      effectId: prompt.effectId,
    }

    if (kind === 'PROMPT') {
      let answer = action.answer
      if (answer == null && action.mode === 'skip') answer = 'no'
      if (answer == null && action.mode === 'apply') answer = 'yes'
      if (answer == null) {
        throw new Error('cards: PROMPT — нужен answer')
      }
      const answerKey = String(answer)
      const choice = (prompt.answers ?? []).find(
        a => String(a.value) === answerKey,
      )
      if ((prompt.answers ?? []).length && !choice) {
        throw new Error(`cards: неизвестный answer "${answer}"`)
      }

      state.effectPrompt = null
      ctx.vars = { ...ctx.vars, answer: answerKey }

      if (choice && Array.isArray(choice.events)) {
        ctx = runBound(choice.events, ctx)
        return ctx.state
      }

      if (!doc) return state
      ctx = resolveDocEffects(doc, ctx, {
        effects,
        facts,
        mode: 'answer',
        kind: prompt.sourceKind ?? 'skill',
      })
      return ctx.state
    }

    if (kind === 'HIGHLIGHT_TARGETS') {
      const targetId = action.targetId
      if (targetId == null) {
        throw new Error('cards: HIGHLIGHT_TARGETS — нужен targetId')
      }
      const ok = (prompt.candidates ?? []).some(
        c => String(c.fighterId) === String(targetId),
      )
      if (!ok) {
        throw new Error(`cards: цель "${targetId}" не среди кандидатов`)
      }

      const count = Number(prompt.count) || 1
      const prev = prompt.vars?.targets ?? []
      const targets = [...prev.map(String), String(targetId)]
      if (targets.length < count) {
        state.effectPrompt = {
          ...prompt,
          vars: { ...(prompt.vars ?? {}), targets },
        }
        return state
      }

      state.effectPrompt = null
      ctx.vars = {
        ...ctx.vars,
        targets: targets.slice(0, count),
      }
      ctx = runBound(prompt.remainingSteps ?? [], ctx)
      return ctx.state
    }

    throw new Error(`cards: resume — неизвестный kind "${kind}"`)
  }

  const listEffectsRegistered = () => Object.keys(effects)
  const listFacts = () => Object.keys(facts)

  const api = {
    register,
    registerMany,
    registerFact,
    registerFacts,
    resolve,
    getSteps,
    normalizeCardTriggers,
    runSteps: (steps, ctx) => runBound(steps, ctx),
    resolveDocEffects: (doc, ctx, mode) =>
      resolveDocEffects(doc, ctx, { effects, facts, mode, kind: ctx.sourceKind }),
    dispatch,
    dispatchMoment,
    resume,
    listEffects: listEffectsRegistered,
    listFacts,
    listDocEffects: listEffects,
    evaluateTriggers: (triggers, ctx) =>
      evaluateTriggers(triggers, ctx, facts),
    triggersNeedAnswer,
  }

  return api
}
