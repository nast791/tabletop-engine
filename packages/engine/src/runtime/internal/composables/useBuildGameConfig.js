import { useNormalizeGameSetup } from './useNormalizeGameSetup.js'
import { useNormalizePlayerSetup } from './useNormalizePlayerSetup.js'
import { useGameIdentity } from './useGameIdentity.js'

/**
 * Внутренний: gameSetup + playerSetup → config для createGame.
 * id/seed не кладём — их создаёт сервер в useCreateGame.
 */
export const useBuildGameConfig = () => {
  const { normalizeGameSetup } = useNormalizeGameSetup()
  const { normalizePlayerSetup } = useNormalizePlayerSetup()
  const { stripSeed } = useGameIdentity()

  const buildGameConfig = ({ gameSetup, playerSetup } = {}) => {
    const players = normalizePlayerSetup(playerSetup?.players ?? playerSetup)
    const game = normalizeGameSetup(
      {
        map: gameSetup?.map,
        rules: gameSetup?.rules,
        options: stripSeed(gameSetup?.options),
      },
      players,
    )

    return {
      map: game.map,
      players,
      rules: game.rules,
      options: game.options,
    }
  }

  return { buildGameConfig }
}
