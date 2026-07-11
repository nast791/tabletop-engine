import { createError, defineEventHandler, readBody } from 'h3'
import { useApply } from '../../internal/composables/useApply.js'
import { useGetView } from '../../internal/composables/useGetView.js'
import { usePartyStore } from '../../internal/composables/usePartyStore.js'

/** POST — применить ход к полному state на сервере, вернуть view ходившего. */
export default defineEventHandler(async (event) => {
  const { apply } = useApply()
  const { getView } = useGetView()
  const { getParty, saveParty } = usePartyStore()

  const body = await readBody(event)
  if (!body?.gameId || !body?.action) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Нужны body.gameId и body.action',
    })
  }

  const state = getParty(body.gameId)
  if (!state) {
    throw createError({ statusCode: 404, statusMessage: 'Партия не найдена' })
  }

  try {
    const next = apply(state, body.action)
    saveParty(next)
    return getView(next, body.action.playerId)
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: error instanceof Error ? error.message : 'Ошибка хода',
    })
  }
})
