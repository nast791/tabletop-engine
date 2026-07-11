import { ACTION_TYPES, PHASES } from '../../constants/phases.js'
import { usePhaseMachine } from './usePhaseMachine.js'

/**
 * Внутренний composable: ход → новое состояние + авто-drain фаз.
 * Не автоимпортируется в целевой проект.
 */
export const useApply = () => {
  const { drainPhases, enterTurnEnd } = usePhaseMachine()

  const cloneShell = (state) => ({
    ...state,
    players: state.players.map((p) => ({ ...p })),
    map: { ...state.map },
    rules: { ...state.rules },
    options: { ...state.options },
  })

  const apply = (state, action) => {
    if (!state || typeof state !== 'object') {
      throw new Error('state должен быть объектом')
    }
    if (!action || typeof action !== 'object' || !action.type) {
      throw new Error('action.type обязателен')
    }

    if (state.phase === PHASES.gameEnd) {
      throw new Error('партия уже завершена (phase=gameEnd)')
    }
    if (state.phase !== PHASES.turn) {
      throw new Error(
        `ходы принимаются только в phase=turn, сейчас "${state.phase}"`,
      )
    }
    if (String(action.playerId) !== String(state.currentPlayer)) {
      throw new Error(
        `action.playerId "${action.playerId}" не совпадает с currentPlayer "${state.currentPlayer}"`,
      )
    }

    let next = cloneShell(state)

    switch (action.type) {
      case ACTION_TYPES.END_TURN:
        next = enterTurnEnd(next)
        break

      case ACTION_TYPES.SPEND_ACTION: {
        if (next.actionsLeft <= 0) {
          throw new Error('actionsLeft уже 0')
        }
        next = {
          ...next,
          actionsLeft: next.actionsLeft - 1,
        }
        if (next.actionsLeft === 0) {
          next = enterTurnEnd(next)
        }
        break
      }

      default:
        throw new Error(
          `неизвестный action.type "${action.type}" (kernel: END_TURN, SPEND_ACTION)`,
        )
    }

    return drainPhases(next)
  }

  return { apply }
}
