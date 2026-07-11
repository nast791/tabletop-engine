/** SPEND_ACTION: −1 AP; при 0 — авто turnEnd. */
export const applySpendAction = (state, _action, { enterTurnEnd }) => {
  if (state.actionsLeft <= 0) {
    throw new Error('actionsLeft уже 0')
  }

  const next = {
    ...state,
    actionsLeft: state.actionsLeft - 1,
  }

  if (next.actionsLeft === 0) {
    return enterTurnEnd(next)
  }

  return next
}
