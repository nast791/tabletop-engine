/**
 * SET_WINNER — мгновенный gameEnd.
 * action.winner: id игрока или null (ничья).
 */
export const applySetWinner = (state, action, { enterGameEnd }) => {
  const raw = action.winner

  if (raw === null || raw === undefined) {
    return enterGameEnd(state, null)
  }

  const winnerId = String(raw)
  const exists = state.players.some((p) => String(p.id) === winnerId)
  if (!exists) {
    throw new Error(`winner "${winnerId}" нет среди players`)
  }

  return enterGameEnd(state, winnerId)
}
