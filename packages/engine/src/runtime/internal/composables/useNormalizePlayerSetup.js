import { useConfigError } from './useConfigError.js'

/**
 * Внутренний: нормализация слотов игроков (id, зоны, team).
 */
export const useNormalizePlayerSetup = () => {
  const { createConfigError } = useConfigError()

  const asPlayerId = (value, label) => {
    if (value === undefined || value === null) {
      throw createConfigError(`${label} обязателен`)
    }
    return String(value)
  }

  const normalizePlayerSetup = (players) => {
    if (!Array.isArray(players) || players.length === 0) {
      throw createConfigError('players должен быть непустым массивом')
    }

    return players.map((player, index) => {
      if (!player || typeof player !== 'object') {
        throw createConfigError(`players[${index}] должен быть объектом`)
      }
      const id = asPlayerId(player.id ?? index, `players[${index}].id`)
      return {
        ...player,
        id,
        team: player.team ?? null,
        deck: Array.isArray(player.deck) ? [...player.deck] : [],
        hand: Array.isArray(player.hand) ? [...player.hand] : [],
        discard: Array.isArray(player.discard) ? [...player.discard] : [],
      }
    })
  }

  return { normalizePlayerSetup }
}
