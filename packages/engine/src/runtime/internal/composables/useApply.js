import { ACTION_TYPES } from '../../constants/actions.js'
import { PHASES } from '../../constants/phases.js'
import { getKernelHandler } from '../actions/index.js'
import { usePhaseMachine } from './usePhaseMachine.js'

/**
 * Внутренний composable: ход → новое состояние + авто-drain фаз.
 * Не автоимпортируется в целевой проект.
 */
export const useApply = () => {
  const { drainPhases, enterTurnEnd, enterGameEnd } = usePhaseMachine()

  const cloneShell = (state) => ({
    ...state,
    players: state.players.map((p) => ({ ...p })),
    map: { ...state.map },
    rules: { ...state.rules },
    options: { ...state.options },
  })

  const assertPlayerInParty = (state, playerId) => {
    const ok = state.players.some((p) => String(p.id) === String(playerId))
    if (!ok) {
      throw new Error(`action.playerId "${playerId}" нет в этой партии`)
    }
  }

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

    assertPlayerInParty(state, action.playerId)

    // RESIGN может любой участник; остальное — только currentPlayer.
    if (action.type !== ACTION_TYPES.RESIGN) {
      if (String(action.playerId) !== String(state.currentPlayer)) {
        throw new Error(
          `action.playerId "${action.playerId}" не совпадает с currentPlayer "${state.currentPlayer}"`,
        )
      }
    }

    const handler = getKernelHandler(action.type)
    if (!handler) {
      throw new Error(
        `неизвестный action.type "${action.type}" (kernel: ${Object.keys(ACTION_TYPES).join(', ')})`,
      )
    }

    const next = handler(cloneShell(state), action, {
      enterTurnEnd,
      enterGameEnd,
    })

    return drainPhases(next)
  }

  return { apply }
}
