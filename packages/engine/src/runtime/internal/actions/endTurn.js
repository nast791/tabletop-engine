/** END_TURN → turnEnd (дальше drain). */
export const applyEndTurn = (state, _action, { enterTurnEnd }) =>
  enterTurnEnd(state)
