import {
  ACTION_TYPES,
  INTERACTIVE_PHASES,
  PHASES,
} from '../../constants/phases.js'

const MAX_DRAIN_STEPS = 32

/**
 * Внутренний: авто-переходы kernel-фаз.
 * gameStart / turnStart / turnEnd схлопываются до turn или gameEnd.
 */
export const usePhaseMachine = () => {
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

  /** Один шаг авто-фазы (неинтерактивной). */
  const stepPhase = (state) => {
    switch (state.phase) {
      case PHASES.gameStart:
        // Хук onGameStart — позже; раздача уже в create.
        return { ...state, phase: PHASES.turnStart }

      case PHASES.turnStart:
        return {
          ...state,
          actionsLeft: state.rules.actionsPerTurn,
          phase: PHASES.turn,
        }

      case PHASES.turnEnd: {
        if (hasWinner(state)) {
          return { ...state, phase: PHASES.gameEnd, actionsLeft: 0 }
        }
        return {
          ...state,
          currentPlayer: nextPlayerId(state),
          turn: state.turn + 1,
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

  const enterTurnEnd = (state) => ({
    ...state,
    phase: PHASES.turnEnd,
  })

  return {
    PHASES,
    ACTION_TYPES,
    isInteractive,
    nextPlayerId,
    drainPhases,
    enterTurnEnd,
  }
}
