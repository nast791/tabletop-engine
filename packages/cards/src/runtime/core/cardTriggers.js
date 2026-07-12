import { TRIGGERS } from '../constants/triggers.js'

/**
 * Шаги для триггера.
 * Приоритет: card.triggers[trigger] → (onPlay) card.events → [].
 */
export const getSteps = (card, trigger) => {
  if (!card || typeof card !== 'object') return []

  const key = String(trigger)
  const fromTriggers = card.triggers?.[key]
  if (Array.isArray(fromTriggers)) return fromTriggers

  if (key === TRIGGERS.onPlay && Array.isArray(card.events)) {
    return card.events
  }

  return []
}

/** Нормализация: events[] → triggers.onPlay (копия карты). */
export const normalizeCardTriggers = (card) => {
  if (!card || typeof card !== 'object') return card
  if (card.triggers && typeof card.triggers === 'object') return { ...card }
  if (!Array.isArray(card.events)) return { ...card }
  return {
    ...card,
    triggers: {
      onPlay: [...card.events],
    },
  }
}
