import { evaluateTriggers, triggersNeedAnswer } from './evaluateTriggers.js'
import { runSteps } from './runSteps.js'

/** effects[] документа (skill/card) или legacy: triggers[]+events. */
export const listEffects = doc => {
  if (!doc || typeof doc !== 'object') return []
  if (Array.isArray(doc.effects) && doc.effects.length) return doc.effects
  if (Array.isArray(doc.triggers)) {
    return [
      {
        id: doc.id,
        triggers: doc.triggers,
        events: doc.events ?? [],
      },
    ]
  }
  return []
}

const metaOf = (doc, kind) => ({
  sourceKind: kind ?? 'doc',
  sourceId: doc?.id ?? null,
  name: doc?.name ?? null,
  text: doc?.text ?? null,
  heroId: doc?.heroId ?? null,
})

/** Если в ctx есть wait — записать state.effectPrompt. */
export const attachPrompt = (ctx, { doc, kind, effectId } = {}) => {
  if (!ctx?.state) return ctx
  if (!ctx.wait) return ctx

  const playerId = ctx.player?.id ?? ctx.state.currentPlayer
  ctx.state.effectPrompt = {
    ...ctx.wait,
    kind: ctx.wait.kind ?? ctx.wait.type,
    playerId: String(playerId),
    remainingSteps: ctx.remainingSteps ?? [],
    vars: ctx.vars ?? {},
    moment: ctx.moment ?? ctx.phase ?? null,
    phase: ctx.phase ?? ctx.moment ?? null,
    effectId: effectId ?? null,
    ...metaOf(doc, kind),
  }
  const { wait, ...rest } = ctx
  return { ...rest, wait: undefined }
}

/**
 * Прогнать effects документа.
 * mode: 'phase' — без ANSWER; 'answer' — только с ANSWER.
 */
export const resolveDocEffects = (
  doc,
  ctx,
  { effects: effectFns, facts, mode = 'phase', kind = 'doc' } = {},
) => {
  let next = { ...ctx, vars: { ...(ctx.vars ?? {}) } }
  if (next.state) next.state.effectPrompt = next.state.effectPrompt ?? null

  for (const effect of listEffects(doc)) {
    const needs = triggersNeedAnswer(effect.triggers)
    if ((mode === 'phase' || mode === 'moment') && needs) continue
    if (mode === 'answer' && !needs) continue

    const checked = evaluateTriggers(
      effect.triggers ?? [],
      {
        state: next.state,
        player: next.player,
        phase: next.phase ?? next.state?.phase,
        moment: next.moment ?? next.phase ?? next.state?.phase,
        vars: next.vars,
        api: next.api,
      },
      facts,
    )
    if (!checked.ok) continue

    next = {
      ...next,
      vars: { ...next.vars, ...checked.vars },
    }

    let stepped = runSteps(effect.events ?? [], next, effectFns)
    stepped = attachPrompt(stepped, { doc, kind, effectId: effect.id })
    next = stepped

    if (next.state?.effectPrompt) return next
  }

  return next
}

/**
 * Источники на момент: skill текущего игрока (позже — карты в игре).
 */
export const collectMomentSources = (state, moment) => {
  const player = (state.players ?? []).find(
    p => String(p.id) === String(state.currentPlayer),
  )
  if (!player) return []
  const out = []
  if (player.skill) {
    out.push({ doc: player.skill, player, kind: 'skill' })
  }
  return out
}

export { triggersNeedAnswer, evaluateTriggers }
