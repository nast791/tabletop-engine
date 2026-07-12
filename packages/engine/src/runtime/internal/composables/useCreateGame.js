import { PHASES } from '../../constants/phases.js'
import { useConfigError } from './useConfigError.js'
import { useNormalizeGameSetup } from './useNormalizeGameSetup.js'
import { useNormalizePlayerSetup } from './useNormalizePlayerSetup.js'
import { useGameIdentity } from './useGameIdentity.js'
import { usePhaseMachine } from './usePhaseMachine.js'

/**
 * Внутренний composable: config → начальное состояние партии.
 * id и seed всегда формируются на сервере.
 * Карточные зоны и раздача — только если у игрока есть deck/hand.
 */
export const useCreateGame = () => {
  const { createConfigError, isConfigError } = useConfigError()
  const { normalizeGameSetup } = useNormalizeGameSetup()
  const { normalizePlayerSetup } = useNormalizePlayerSetup()
  const { createGameId, createSeed, stripSeed } = useGameIdentity()
  const { drainPhases } = usePhaseMachine()

  const hasCardZones = (player) =>
    Array.isArray(player.deck) || Array.isArray(player.hand)

  // Раздача только для игроков с колодой; иначе контент не трогаем.
  const dealOpeningHands = (players, handSize) =>
    players.map((player) => {
      if (!hasCardZones(player)) return { ...player }

      const deck = Array.isArray(player.deck) ? [...player.deck] : []
      const hand = Array.isArray(player.hand) ? [...player.hand] : []
      while (hand.length < handSize && deck.length > 0) {
        const card = deck.pop()
        if (card !== undefined) hand.push(card)
      }
      return { ...player, deck, hand }
    })

  const createGame = (config) => {
    if (!config || typeof config !== 'object') {
      throw createConfigError('config должен быть объектом')
    }

    const players = normalizePlayerSetup(config.players)
    const game = normalizeGameSetup(
      {
        map: config.map,
        rules: config.rules,
        options: stripSeed(config.options),
      },
      players,
    )

    const id = createGameId()
    const seed = createSeed()

    // TODO(v0+): seeded shuffle перед раздачей по seed
    const dealt = dealOpeningHands(players, game.rules.handSize)

    const initial = {
      id,
      map: game.map,
      players: dealt,
      rules: game.rules,
      options: {
        ...game.options,
        seed,
      },
      currentPlayer: game.rules.startingPlayer,
      turn: 0,
      actionsLeft: 0,
      phase: PHASES.gameStart,
      winner: false,
      visibilityGrants: [],
      logSeq: 0,
      combat: null,
      movement: null,
      handDiscard: null,
      lastCombat: null,
      effectPrompt: null,
    }

    // Останавливается на gameStart (интерактив: расстановка), пока хост не сдвинет фазу.
    return drainPhases(initial)
  }

  return { createGame, isConfigError }
}
