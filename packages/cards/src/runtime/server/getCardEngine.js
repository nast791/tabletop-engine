import { createCardEngine } from '../core/createCardEngine.js'
import hostEffectsMod from '#tabletop-card-effects'

/** Достать map type → handler из default export хоста. */
export const pickHostEffects = (mod) => {
  if (!mod || typeof mod !== 'object') return {}
  if (mod.effects && typeof mod.effects === 'object') return { ...mod.effects }
  return { ...mod }
}

let engine = null

/**
 * Singleton движка с эффектами хоста (#tabletop-card-effects).
 * Для server actions / Nitro и composable useCardEngine.
 */
export const getCardEngine = () => {
  if (!engine) {
    engine = createCardEngine({
      effects: pickHostEffects(hostEffectsMod),
    })
  }
  return engine
}

/** Сброс singleton (тесты / HMR). */
export const resetCardEngine = () => {
  engine = null
}
