import { ACTION_TYPES } from '../../constants/actions.js'
import { PHASES } from '../../constants/phases.js'
import { getKernelHandler } from '../actions/index.js'
import { usePhaseMachine } from './usePhaseMachine.js'
import hostActions from '#tabletop-host-actions'

const HOST_LIFECYCLE_KEYS = new Set([
  'beforeEnterTurnEnd',
  'onPhase',
  'onGameStart',
  'onTurnStart',
  'onTurnEnd',
  'onGameEnd',
])

/**
 * Внутренний composable: ход → новое состояние + авто-drain фаз.
 * Сначала хост (#tabletop-host-actions), иначе kernel.
 * Хост может перекрыть kernel type (END_TURN и т.п.).
 *
 * Интерактивны: gameStart (расстановка), turn, gameEnd.
 */
export const useApply = () => {
  const callPhaseHook = (name, state, api) => {
    const specific = hostActions?.[name]
    const generic = hostActions?.onPhase
    const hook = typeof specific === 'function' ? specific : generic
    if (typeof hook === 'function') {
      return hook(state, api)
    }
    return state
  }

  const { drainPhases, enterTurnEnd, enterGameEnd } = usePhaseMachine({
    hooks: {
      onGameStart: state =>
        callPhaseHook('onGameStart', state, { enterTurnEnd, enterGameEnd }),
      onTurnStart: state =>
        callPhaseHook('onTurnStart', state, { enterTurnEnd, enterGameEnd }),
      onTurnEnd: state =>
        callPhaseHook('onTurnEnd', state, { enterTurnEnd, enterGameEnd }),
      onGameEnd: state =>
        callPhaseHook('onGameEnd', state, { enterTurnEnd, enterGameEnd }),
    },
  })

  const cloneShell = state => ({
    ...state,
    players: state.players.map(p => ({
      ...p,
      fighters: Array.isArray(p.fighters)
        ? p.fighters.map(f => ({ ...f }))
        : p.fighters,
      items: Array.isArray(p.items) ? p.items.map(i => ({ ...i })) : p.items,
      deck: Array.isArray(p.deck) ? [...p.deck] : p.deck,
      hand: Array.isArray(p.hand) ? [...p.hand] : p.hand,
      discard: Array.isArray(p.discard) ? [...p.discard] : p.discard,
    })),
    map: {
      ...state.map,
      nodes: Array.isArray(state.map?.nodes) ? [...state.map.nodes] : state.map?.nodes,
    },
    rules: { ...state.rules },
    options: { ...state.options },
    combat: state.combat ? { ...state.combat } : state.combat ?? null,
    movement: state.movement
      ? {
          ...state.movement,
          stepsUsed: { ...(state.movement.stepsUsed || {}) },
          origins: { ...(state.movement.origins || {}) },
        }
      : state.movement ?? null,
    handDiscard: state.handDiscard ? { ...state.handDiscard } : state.handDiscard ?? null,
    lastCombat: state.lastCombat ? { ...state.lastCombat } : state.lastCombat ?? null,
    effectPrompt: state.effectPrompt
      ? {
          ...state.effectPrompt,
          candidates: Array.isArray(state.effectPrompt.candidates)
            ? state.effectPrompt.candidates.map(c => ({ ...c }))
            : state.effectPrompt.candidates,
          answers: Array.isArray(state.effectPrompt.answers)
            ? state.effectPrompt.answers.map(a => ({ ...a }))
            : state.effectPrompt.answers,
        }
      : state.effectPrompt ?? null,
  })

  const assertPlayerInParty = (state, playerId) => {
    const ok = state.players.some(p => String(p.id) === String(playerId))
    if (!ok) {
      throw new Error(`action.playerId "${playerId}" нет в этой партии`)
    }
  }

  const hostActionKeys = () =>
    hostActions
      ? Object.keys(hostActions).filter(k => !HOST_LIFECYCLE_KEYS.has(k))
      : []

  const resolveHandler = type => {
    if (HOST_LIFECYCLE_KEYS.has(type)) return null
    // Хост перекрывает kernel (например END_TURN со своими правилами).
    const host = hostActions?.[type]
    if (typeof host === 'function') return { handler: host, source: 'host' }
    const kernel = getKernelHandler(type)
    if (kernel) return { handler: kernel, source: 'kernel' }
    return null
  }

  /** Хост может отложить turnEnd (например сброс руки > max). */
  const wrappedEnterTurnEnd = state => {
    const hook = hostActions?.beforeEnterTurnEnd
    if (typeof hook === 'function') {
      return hook(state, { enterTurnEnd, enterGameEnd })
    }
    return enterTurnEnd(state)
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
    if (state.phase !== PHASES.turn && state.phase !== PHASES.gameStart) {
      throw new Error(
        `ходы принимаются в phase=gameStart|turn, сейчас "${state.phase}"`,
      )
    }

    assertPlayerInParty(state, action.playerId)

    const resolved = resolveHandler(action.type)
    if (!resolved) {
      throw new Error(
        `неизвестный action.type "${action.type}" (kernel: ${Object.keys(ACTION_TYPES).join(', ')}; host: ${hostActionKeys().join(', ') || '—'})`,
      )
    }

    // RESIGN — любой; gameStart host (PLACE…) — любой;
    // DEFEND — защищающийся при state.combat;
    // DISCARD_CARDS — игрок из state.handDiscard;
    // RESOLVE_EFFECT — игрок из state.effectPrompt;
    // остальное в turn — currentPlayer.
    if (action.type !== ACTION_TYPES.RESIGN) {
      const hostDuringStart =
        state.phase === PHASES.gameStart && resolved.source === 'host'
      const hostDefend =
        state.phase === PHASES.turn &&
        resolved.source === 'host' &&
        action.type === 'DEFEND' &&
        state.combat &&
        String(action.playerId) === String(state.combat.defenderPlayerId)
      const hostDiscard =
        state.phase === PHASES.turn &&
        resolved.source === 'host' &&
        action.type === 'DISCARD_CARDS' &&
        state.handDiscard &&
        String(action.playerId) === String(state.handDiscard.playerId)
      const hostEffect =
        state.phase === PHASES.turn &&
        resolved.source === 'host' &&
        action.type === 'RESOLVE_EFFECT' &&
        state.effectPrompt &&
        String(action.playerId) === String(state.effectPrompt.playerId)

      if (!hostDuringStart && !hostDefend && !hostDiscard && !hostEffect) {
        if (String(action.playerId) !== String(state.currentPlayer)) {
          throw new Error(
            `action.playerId "${action.playerId}" не совпадает с currentPlayer "${state.currentPlayer}"`,
          )
        }
      }
    }

    // Пока сброс руки — только DISCARD_CARDS / RESIGN.
    if (
      state.handDiscard &&
      action.type !== 'DISCARD_CARDS' &&
      action.type !== ACTION_TYPES.RESIGN
    ) {
      throw new Error('сначала сбросьте лишние карты (DISCARD_CARDS)')
    }

    // Пока висит бой — только DEFEND / RESIGN.
    if (
      state.combat &&
      action.type !== 'DEFEND' &&
      action.type !== ACTION_TYPES.RESIGN
    ) {
      throw new Error('сначала завершите бой (DEFEND)')
    }

    // Пока pause эффекта — только RESOLVE_EFFECT / RESIGN.
    if (
      state.effectPrompt &&
      action.type !== 'RESOLVE_EFFECT' &&
      action.type !== ACTION_TYPES.RESIGN
    ) {
      throw new Error('сначала ответьте на эффект (RESOLVE_EFFECT)')
    }

    // Пока открыто перемещение — только MOVE / RESIGN.
    if (
      state.movement &&
      action.type !== 'MOVE' &&
      action.type !== ACTION_TYPES.RESIGN
    ) {
      throw new Error('сначала завершите перемещение (MOVE confirm)')
    }

    if (state.phase === PHASES.gameStart && resolved.source === 'kernel') {
      if (action.type !== ACTION_TYPES.RESIGN) {
        throw new Error(
          `в gameStart kernel-action "${action.type}" недоступен (сначала расстановка)`,
        )
      }
    }

    const next = resolved.handler(cloneShell(state), action, {
      enterTurnEnd: wrappedEnterTurnEnd,
      enterGameEnd,
    })

    return drainPhases(next)
  }

  return { apply }
}
