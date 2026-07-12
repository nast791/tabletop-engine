import { createCardEngine } from '../core/createCardEngine.js'
import hostMod from '#tabletop-card-effects'

/** Достать map type → handler из default export хоста. */
export const pickHostEffects = (mod) => {
  if (!mod || typeof mod !== 'object') return {}
  if (mod.effects && typeof mod.effects === 'object') return { ...mod.effects }
  return { ...mod }
}

export const pickHostFacts = (mod) => {
  if (!mod || typeof mod !== 'object') return {}
  if (mod.facts && typeof mod.facts === 'object') return { ...mod.facts }
  return {}
}

let engine = null

/**
 * Singleton движка с эффектами/фактами хоста (#tabletop-card-effects).
 */
export const getCardEngine = () => {
  if (!engine) {
    engine = createCardEngine({
      effects: pickHostEffects(hostMod),
      facts: pickHostFacts(hostMod),
    })
  }
  return engine
}

/** Сброс singleton (тесты / HMR). */
export const resetCardEngine = () => {
  engine = null
}
