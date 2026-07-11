import { useState } from 'nuxt/app'
import { STATE_KEYS } from '../constants/stateKeys.js'

/**
 * Внешний composable: слоты игроков (открытый контент).
 * Engine фиксирует только id (и опционально team); остальное — с хоста.
 */
export const usePlayerSetup = () => {
  const players = useState(STATE_KEYS.setupPlayers, () => [])

  const add = (player = {}) => {
    const index = players.value.length
    const id = player.id != null ? String(player.id) : String(index)
    const next = {
      ...player,
      id,
      ...(player.team !== undefined ? { team: player.team } : {}),
    }
    players.value = [...players.value, next]
    return next
  }

  const remove = (indexOrId) => {
    players.value = players.value.filter((p, index) => {
      if (typeof indexOrId === 'number') return index !== indexOrId
      return String(p.id) !== String(indexOrId)
    })
  }

  const update = (indexOrId, patch) => {
    players.value = players.value.map((p, index) => {
      const match =
        typeof indexOrId === 'number'
          ? index === indexOrId
          : String(p.id) === String(indexOrId)
      if (!match) return p
      return {
        ...p,
        ...patch,
        id: patch.id != null ? String(patch.id) : p.id,
      }
    })
  }

  const reset = () => {
    players.value = []
  }

  const isReady = () => players.value.length > 0

  const toObject = () => ({
    players: players.value.map((p) => ({ ...p })),
  })

  return {
    players,
    add,
    remove,
    update,
    reset,
    isReady,
    toObject,
  }
}
