/**
 * RESIGN — сдаться.
 * Сейчас: ровно 2 игрока → побеждает второй; иначе используйте SET_WINNER.
 * Может вызвать любой участник партии (не только currentPlayer).
 */
export const applyResign = (state, action, { enterGameEnd }) => {
  const resigningId = String(action.playerId)
  const others = state.players.filter((p) => String(p.id) !== resigningId)

  if (state.players.length !== 2 || others.length !== 1) {
    throw new Error(
      'RESIGN только для партии на двоих; иначе пришлите SET_WINNER',
    )
  }

  return enterGameEnd(state, String(others[0].id))
}
