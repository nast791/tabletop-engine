import { useRuntimeConfig } from 'nuxt/app'
import { $fetch } from 'ofetch'

/**
 * Внутренний composable: HTTP к API модуля.
 * Не автоимпортируется в целевой проект.
 */
export const useGameApi = () => {
  const config = useRuntimeConfig()
  const prefix = config.public?.tabletopEngine?.apiPrefix ?? '/api/tabletop'

  const createParty = (gameConfig, playerId) =>
    $fetch(`${prefix}/create`, {
      method: 'POST',
      body: { config: gameConfig, playerId },
    })

  const sendAction = (gameId, action) =>
    $fetch(`${prefix}/action`, {
      method: 'POST',
      body: { gameId, action },
    })

  const fetchView = (gameId, playerId) =>
    $fetch(`${prefix}/view`, {
      query: { gameId, playerId },
    })

  return { prefix, createParty, sendAction, fetchView }
}
