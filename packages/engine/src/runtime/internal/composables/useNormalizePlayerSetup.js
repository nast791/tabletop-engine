import { CARD_ZONES } from '../../constants/player.js'
import { useConfigError } from './useConfigError.js'

/**
 * Внутренний: нормализация слотов игроков.
 * Kernel: id, team?, опциональные card-зоны.
 * Остальное (map content, items, heroes, class…) — as-is с хоста.
 */
export const useNormalizePlayerSetup = () => {
  const { createConfigError } = useConfigError()

  const asPlayerId = (value, label) => {
    if (value === undefined || value === null) {
      throw createConfigError(`${label} обязателен`)
    }
    return String(value)
  }

  const copyZoneIfPresent = (player, zone) => {
    if (!Object.prototype.hasOwnProperty.call(player, zone)) return undefined
    if (!Array.isArray(player[zone])) {
      throw createConfigError(
        `players[].${zone} должен быть массивом, если поле задано`,
      )
    }
    return [...player[zone]]
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
      const next = {
        ...player,
        id,
        team: player.team != null ? player.team : null,
      }

      for (const zone of CARD_ZONES) {
        const copied = copyZoneIfPresent(player, zone)
        if (copied !== undefined) next[zone] = copied
        else delete next[zone]
      }

      return next
    })
  }

  return { normalizePlayerSetup }
}
