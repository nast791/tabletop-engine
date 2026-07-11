import { INTERACTIVE_PHASES, PHASES } from '../../constants/phases.js'
import { mergePhaseHooks } from './usePhaseHooks.js'

const MAX_DRAIN_STEPS = 32

/**
 * Внутренний: авто-переходы kernel-фаз.
 * gameStart / turnStart / turnEnd схлопываются до turn или gameEnd.
 * Хуки onTurnStart / onTurnEnd / … пока no-op.
 */
export const usePhaseMachine = (options = {}) => {
  const hooks = mergePhaseHooks(options.hooks)

  const isInteractive = (phase) => INTERACTIVE_PHASES.includes(phase)

  const nextPlayerId = (state) => {
    const ids = state.players.map((p) => String(p.id))
    const current = String(state.currentPlayer)
    const index = ids.indexOf(current)
    if (index < 0) return ids[0]
    return ids[(index + 1) % ids.length]
  }

  const hasWinner = (state) =>
    state.winner !== false && state.winner != null

  const enterTurnEnd = (state) => ({
    ...state,
    phase: PHASES.turnEnd,
  })

  const enterGameEnd = (state, winner) => {
    const next = {
      ...state,
      winner: winner === undefined ? state.winner : winner,
      actionsLeft: 0,
      phase: PHASES.gameEnd,
    }
    return hooks.onGameEnd(next)
  }

  /** Один шаг авто-фазы (неинтерактивной). */
  const stepPhase = (state) => {
    switch (state.phase) {
      case PHASES.gameStart: {
        const afterHook = hooks.onGameStart(state)
        return { ...afterHook, phase: PHASES.turnStart }
      }

      case PHASES.turnStart: {
        const prepared = {
          ...state,
          actionsLeft: state.rules.actionsPerTurn,
        }
        const afterHook = hooks.onTurnStart(prepared)
        return { ...afterHook, phase: PHASES.turn }
      }

      case PHASES.turnEnd: {
        const afterHook = hooks.onTurnEnd(state)
        if (hasWinner(afterHook)) {
          return enterGameEnd(afterHook, afterHook.winner)
        }
        return {
          ...afterHook,
          currentPlayer: nextPlayerId(afterHook),
          turn: afterHook.turn + 1,
          phase: PHASES.turnStart,
        }
      }

      default:
        return state
    }
  }

  /**
   * Прогоняет авто-фазы, пока не turn / gameEnd.
   * Возвращает новое state (поверхностные копии на каждом шаге).
   */
  const drainPhases = (state) => {
    let next = state
    let steps = 0

    while (!isInteractive(next.phase) && steps < MAX_DRAIN_STEPS) {
      const before = next.phase
      next = stepPhase(next)
      steps += 1
      if (next.phase === before) {
        throw new Error(
          `phase machine застряла на "${before}" — нет перехода`,
        )
      }
    }

    if (!isInteractive(next.phase)) {
      throw new Error(
        `phase drain превысил ${MAX_DRAIN_STEPS} шагов (phase=${next.phase})`,
      )
    }

    return next
  }

  return {
    PHASES,
    hooks,
    isInteractive,
    nextPlayerId,
    drainPhases,
    enterTurnEnd,
    enterGameEnd,
  }
}
