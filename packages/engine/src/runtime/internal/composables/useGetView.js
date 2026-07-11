import { CARD_ZONES } from '../../constants/player.js'
import { useZoneVisibility } from './useZoneVisibility.js'

/**
 * Внутренний composable: полное state → view.
 * Карточные зоны маскируются только если они есть у игрока.
 * Прочий контент (fighters, items, class…) уходит as-is.
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

    return masked
  }

  const getView = (state, playerId) => {
    if (!state?.players?.some((p) => String(p.id) === String(playerId))) {
      throw new Error(`playerId "${playerId}" нет в этой партии`)
    }

    const grantsForViewer = (state.visibilityGrants ?? []).filter(
      (g) => String(g.viewerId) === String(playerId),
    )

    return {
      id: state.id,
      you: String(playerId),
      currentPlayer: state.currentPlayer,
      turn: state.turn,
      rules: {
        startingPlayer: state.rules.startingPlayer,
        actionsPerTurn: state.rules.actionsPerTurn,
        handSize: state.rules.handSize,
        visibility: state.rules.visibility,
      },
      map: { ...state.map },
      players: state.players.map((p) => maskPlayer(state, p, playerId)),
      winner: state.winner,
      visibilityGrants: grantsForViewer,
    }
  }

  return { getView }
}
