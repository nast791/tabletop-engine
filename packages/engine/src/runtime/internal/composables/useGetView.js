import { useZoneVisibility } from './useZoneVisibility.js'

/**
 * Внутренний composable: полное state → view (туман войны по visibility + grants).
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
    const hand = maskZone(player.hand, canSee(state, viewerId, player.id, 'hand'))
    const deck = maskZone(player.deck, canSee(state, viewerId, player.id, 'deck'))
    const discard = maskZone(
      player.discard,
      canSee(state, viewerId, player.id, 'discard'),
    )

    const publicFields = Object.fromEntries(
      Object.entries(player).filter(
        ([key]) => !['deck', 'hand', 'discard'].includes(key),
      ),
    )

    return {
      ...publicFields,
      id: player.id,
      hand: hand.cards,
      handCount: hand.count,
      deck: deck.cards,
      deckCount: deck.count,
      discard: discard.cards,
      discardCount: discard.count,
    }
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
        // visibility в view — чтобы UI знал политику; grants отдельно
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
