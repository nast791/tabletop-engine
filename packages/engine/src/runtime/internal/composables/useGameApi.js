import { useRuntimeConfig } from 'nuxt/app'
import { $fetch } from 'ofetch'

/**
 * Внутренний composable: HTTP к API модуля.
 * Не автоимпортируется в целевой проект.
 */
export const useGameApi = () => {
  const config = useRuntimeConfig()
  const prefix = config.public?.tabletopEngine?.apiPrefix ?? '/api/tabletop'

  const actionErrorMessage = err => {
    const data = err && typeof err === 'object' ? err.data : null
    const candidates = [
      data?.data?.message,
      data?.message,
      data?.statusMessage,
      err instanceof Error ? err.message : null,
    ]
    for (const raw of candidates) {
      if (typeof raw !== 'string' || !raw.trim()) continue
      if (raw === 'Bad Request' || raw === 'Action failed') continue
      if (raw.startsWith('[POST]') || raw.startsWith('[GET]')) continue
      return raw
    }
    return 'Ошибка хода'
  }

  const createParty = (gameConfig, playerId) =>
    $fetch(`${prefix}/create`, {
      method: 'POST',
      body: { config: gameConfig, playerId },
    })

  const sendAction = async (gameId, action) => {
    try {
      return await $fetch(`${prefix}/action`, {
        method: 'POST',
        body: { gameId, action },
      })
    } catch (err) {
      throw new Error(actionErrorMessage(err))
    }
  }

  const fetchView = (gameId, playerId) =>
    $fetch(`${prefix}/view`, {
      query: { gameId, playerId },
    })

  return { prefix, createParty, sendAction, fetchView }
}
