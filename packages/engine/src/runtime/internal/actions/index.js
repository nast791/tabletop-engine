import { ACTION_TYPES } from '../../constants/actions.js'
import { applyEndTurn } from './endTurn.js'
import { applySpendAction } from './spendAction.js'
import { applySetWinner } from './setWinner.js'
import { applyResign } from './resign.js'

/** Реестр kernel-handlers: (state, action, api) => state */
export const KERNEL_ACTION_HANDLERS = {
  [ACTION_TYPES.END_TURN]: applyEndTurn,
  [ACTION_TYPES.SPEND_ACTION]: applySpendAction,
  [ACTION_TYPES.SET_WINNER]: applySetWinner,
  [ACTION_TYPES.RESIGN]: applyResign,
}

export const getKernelHandler = (type) => KERNEL_ACTION_HANDLERS[type]
