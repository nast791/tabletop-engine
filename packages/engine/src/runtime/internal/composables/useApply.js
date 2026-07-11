import { ACTION_TYPES } from '../../constants/actions.js'
import { PHASES } from '../../constants/phases.js'
import { getKernelHandler } from '../actions/index.js'
import { usePhaseMachine } from './usePhaseMachine.js'
import hostActions from '#tabletop-host-actions'

/**
 * Внутренний composable: ход → новое состояние + авто-drain фаз.
 * Сначала kernel, затем хостовый реестр (#tabletop-host-actions).
 *
 * Интерактивны: gameStart (расстановка), turn, gameEnd.
 */
export const useApply = () => {
  const { drainPhases, enterTurnEnd, enterGameEnd } = usePhaseMachine()

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
  })

  const assertPlayerInParty = (state, playerId) => {
    const ok = state.players.some(p => String(p.id) === String(playerId))
    if (!ok) {
      throw new Error(`action.playerId "${playerId}" нет в этой партии`)
    }
  }

  const resolveHandler = type => {
    const kernel = getKernelHandler(type)
    if (kernel) return { handler: kernel, source: 'kernel' }
    const host = hostActions?.[type]
    if (typeof host === 'function') return { handler: host, source: 'host' }
    return null
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
      const hostKeys = hostActions ? Object.keys(hostActions).join(', ') : ''
      throw new Error(
        `неизвестный action.type "${action.type}" (kernel: ${Object.keys(ACTION_TYPES).join(', ')}; host: ${hostKeys || '—'})`,
      )
    }

    // RESIGN — любой; в gameStart хост (PLACE…) — любой участник;
    // kernel и ходы в turn — только currentPlayer.
    if (action.type !== ACTION_TYPES.RESIGN) {
      const hostDuringStart =
        state.phase === PHASES.gameStart && resolved.source === 'host'
      if (!hostDuringStart) {
        if (String(action.playerId) !== String(state.currentPlayer)) {
          throw new Error(
            `action.playerId "${action.playerId}" не совпадает с currentPlayer "${state.currentPlayer}"`,
          )
        }
      }
    }

    if (state.phase === PHASES.gameStart && resolved.source === 'kernel') {
      if (action.type !== ACTION_TYPES.RESIGN) {
        throw new Error(
          `в gameStart kernel-action "${action.type}" недоступен (сначала расстановка)`,
        )
      }
    }

    const next = resolved.handler(cloneShell(state), action, {
      enterTurnEnd,
      enterGameEnd,
    })

    return drainPhases(next)
  }

  return { apply }
}
