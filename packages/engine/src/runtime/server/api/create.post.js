import { createError, defineEventHandler, readBody } from 'h3'
import { useCreateGame } from '../../internal/composables/useCreateGame.js'
import { useGetView } from '../../internal/composables/useGetView.js'
import { usePartyStore } from '../../internal/composables/usePartyStore.js'

/** POST — создать партию на сервере, вернуть view для playerId. */
export default defineEventHandler(async (event) => {
  const { createGame, isConfigError } = useCreateGame()
  const { getView } = useGetView()
  const { saveParty } = usePartyStore()

  const body = await readBody(event)
  if (!body?.config) {
    throw createError({ statusCode: 400, statusMessage: 'Нужен body.config' })
  }

  try {
    const state = createGame(body.config)
    saveParty(state)

    const playerId = String(body.playerId ?? state.currentPlayer)
    return getView(state, playerId)
  } catch (error) {
    if (isConfigError(error)) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw error
  }
})
