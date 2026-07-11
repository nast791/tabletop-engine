import { createError, defineEventHandler, getQuery } from 'h3'
import { useGetView } from '../../internal/composables/useGetView.js'
import { usePartyStore } from '../../internal/composables/usePartyStore.js'

/** GET ?gameId=&playerId= — view для игрока (полное state не отдаём). */
export default defineEventHandler((event) => {
  const { getView } = useGetView()
  const { getParty } = usePartyStore()

  const query = getQuery(event)
  const gameId = String(query.gameId ?? '')
  const playerId = String(query.playerId ?? '')

  if (!gameId || !playerId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нужны query.gameId и query.playerId',
    })
  }

  const state = getParty(gameId)
  if (!state) {
    throw createError({ statusCode: 404, statusMessage: 'Партия не найдена' })
  }

  try {
    return getView(state, playerId)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Ошибка view',
    })
  }
})
