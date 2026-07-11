import { CARD_ZONES } from '../../constants/player.js'
import { PHASES } from '../../constants/phases.js'
import { useZoneVisibility } from './useZoneVisibility.js'

/**
 * Внутренний composable: полное state → view.
 * Карточные зоны маскируются по visibility.
 * В gameStart чужие fighters без position (расстановка скрыта до хода).
 */
export const useGetView = () => {
  const { canSee } = useZoneVisibility()

  const maskZone = (cards, see) => {
    const list = Array.isArray(cards) ? cards : []
    return {
      cards: see.cards ? [...list] : undefined,
      count: see.count ? list.length : undefined,
    }
  }

  const hideFighterPlacement = fighter => ({
    ...fighter,
    position: null,
    startPosition: null,
  })

  const maskPlayer = (state, player, viewerId) => {
    const publicFields = Object.fromEntries(
      Object.entries(player).filter(([key]) => !CARD_ZONES.includes(key)),
    )

    const masked = {
      ...publicFields,
      id: player.id,
    }

    for (const zone of CARD_ZONES) {
      if (!Array.isArray(player[zone])) continue
      const see = canSee(state, viewerId, player.id, zone)
      const result = maskZone(player[zone], see)
      masked[zone] = result.cards
      masked[`${zone}Count`] = result.count
    }

    // Расстановка: чужие позиции скрыты до выхода из gameStart.
    if (
      state.phase === PHASES.gameStart &&
      String(player.id) !== String(viewerId) &&
      Array.isArray(masked.fighters)
    ) {
      masked.fighters = masked.fighters.map(hideFighterPlacement)
    }

    return masked
  }

  const getView = (state, playerId) => {
    if (!state?.players?.some(p => String(p.id) === String(playerId))) {
      throw new Error(`playerId "${playerId}" нет в этой партии`)
    }

    const grantsForViewer = (state.visibilityGrants ?? []).filter(
      g => String(g.viewerId) === String(playerId),
    )

    return {
      id: state.id,
      you: String(playerId),
      currentPlayer: state.currentPlayer,
      turn: state.turn,
      phase: state.phase,
      actionsLeft: state.actionsLeft,
      combat: state.combat ?? null,
      movement: state.movement ?? null,
      handDiscard: state.handDiscard ?? null,
      lastCombat: state.lastCombat ?? null,
      rules: {
        startingPlayer: state.rules.startingPlayer,
        actionsPerTurn: state.rules.actionsPerTurn,
        handSize: state.rules.handSize,
        maxHandSize: state.rules.maxHandSize,
        visibility: state.rules.visibility,
      },
      map: { ...state.map },
      players: state.players.map(p => maskPlayer(state, p, playerId)),
      winner: state.winner,
      visibilityGrants: grantsForViewer,
    }
  }

  return { getView }
}
