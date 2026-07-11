import { useState } from 'nuxt/app'
import { useGameApi } from '../internal/composables/useGameApi.js'
import { useBuildGameConfig } from '../internal/composables/useBuildGameConfig.js'
import { STATE_KEYS } from '../constants/stateKeys.js'
import { useGameSetup } from './useGameSetup.js'
import { usePlayerSetup } from './usePlayerSetup.js'

/**
 * Внешний composable (автоимпорт): клиент держит только view + id партии.
 */
export const useGameView = () => {
  const { createParty, sendAction: postAction, fetchView } = useGameApi()
  const { buildGameConfig } = useBuildGameConfig()
  const gameSetup = useGameSetup()
  const playerSetup = usePlayerSetup()

  const view = useState(STATE_KEYS.view, () => null)
  const playerId = useState(STATE_KEYS.playerId, () => '0')
  const gameId = useState(STATE_KEYS.gameId, () => null)

  const create = async (gameConfig, asPlayerId) => {
    const nextPlayerId = String(
      asPlayerId ?? gameConfig.rules?.startingPlayer ?? '0',
    )
    playerId.value = nextPlayerId
    view.value = await createParty(gameConfig, nextPlayerId)
    gameId.value = view.value?.id ?? null
    if (gameId.value) gameSetup.setId(gameId.value)
    return view.value
  }

  /** Собрать config из setup и создать партию (id/seed на сервере). */
  const createFromSetup = async (asPlayerId) => {
    const config = buildGameConfig({
      gameSetup: gameSetup.toObject(),
      playerSetup: playerSetup.toObject(),
    })
    return create(config, asPlayerId)
  }

  const sendAction = async (action) => {
    if (!view.value?.id) {
      throw new Error('Нет активной партии (view пустой)')
    }
    const payload = {
      ...action,
      playerId: String(action.playerId ?? playerId.value),
    }
    view.value = await postAction(view.value.id, payload)
    return view.value
  }

  const refresh = async () => {
    if (!view.value?.id) {
      throw new Error('Нет активной партии (view пустой)')
    }
    view.value = await fetchView(view.value.id, playerId.value)
    return view.value
  }

  const clear = () => {
    view.value = null
    gameId.value = null
  }

  return {
    view,
    gameId,
    playerId,
    create,
    createFromSetup,
    sendAction,
    refresh,
    clear,
  }
}
