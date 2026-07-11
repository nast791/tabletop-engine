import { useState } from 'nuxt/app'
import { STATE_KEYS } from '../constants/stateKeys.js'

/**
 * Внешний composable: настройки игроков (слоты, герой, team, зоны-контент).
 * Автоимпорт в целевой проект.
 */
export const usePlayerSetup = () => {
  const players = useState(STATE_KEYS.setupPlayers, () => [])

  const add = (player = {}) => {
    const index = players.value.length
    const next = {
      id: player.id != null ? String(player.id) : String(index),
      team: player.team ?? null,
      type: player.type,
      packId: player.packId,
      name: player.name,
      color: player.color,
      deck: Array.isArray(player.deck) ? [...player.deck] : [],
      hand: Array.isArray(player.hand) ? [...player.hand] : [],
      discard: Array.isArray(player.discard) ? [...player.discard] : [],
      ...player,
      id: player.id != null ? String(player.id) : String(index),
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

  const setHero = (indexOrId, heroPatch) => {
    update(indexOrId, heroPatch)
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
    setHero,
    reset,
    isReady,
    toObject,
  }
}
