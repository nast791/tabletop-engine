import { useConfigError } from './useConfigError.js'
import { useNormalizeGameSetup } from './useNormalizeGameSetup.js'
import { useNormalizePlayerSetup } from './useNormalizePlayerSetup.js'
import { useGameIdentity } from './useGameIdentity.js'

/**
 * Внутренний composable: config → начальное состояние партии.
 * id и seed всегда формируются на сервере.
 */
export const useCreateGame = () => {
  const { createConfigError, isConfigError } = useConfigError()
  const { normalizeGameSetup } = useNormalizeGameSetup()
  const { normalizePlayerSetup } = useNormalizePlayerSetup()
  const { createGameId, createSeed, stripSeed } = useGameIdentity()

  // Раздать до handSize карт из колоды в руку (позже — детерминированно по seed).
  const dealOpeningHands = (players, handSize) =>
    players.map((player) => {
      const deck = [...(player.deck ?? [])]
      const hand = [...(player.hand ?? [])]
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
        // seed с клиента отбрасываем — генерируем только здесь
        options: stripSeed(config.options),
      },
      players,
    )

    const id = createGameId()
    const seed = createSeed()

    // TODO(v0+): seeded shuffle перед раздачей по seed
    const dealt = dealOpeningHands(players, game.rules.handSize)

    return {
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
      winner: false,
      visibilityGrants: [],
      logSeq: 0,
    }
  }

  return { createGame, isConfigError }
}
