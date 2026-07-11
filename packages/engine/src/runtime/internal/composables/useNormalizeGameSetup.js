import { DEFAULT_RULES } from '../../constants/rules.js'
import { useConfigError } from './useConfigError.js'
import { useZoneVisibility } from './useZoneVisibility.js'

/**
 * Внутренний: нормализация настроек партии (map / rules / options).
 */
export const useNormalizeGameSetup = () => {
  const { createConfigError } = useConfigError()
  const { mergeVisibility } = useZoneVisibility()

  const asPlayerId = (value, label) => {
    if (value === undefined || value === null) {
      throw createConfigError(`${label} обязателен`)
    }
    return String(value)
  }

  const positiveInt = (value, label, fallback) => {
    if (value === undefined) return fallback
    const n = Number(value)
    if (!Number.isInteger(n) || n < 1) {
      throw createConfigError(`${label} должен быть целым числом ≥ 1`)
    }
    return n
  }

  const normalizeGameSetup = (setup = {}, players = []) => {
    const map = setup.map
    if (!map || typeof map !== 'object') {
      throw createConfigError('map должен быть объектом')
    }

    const partial = setup.rules ?? {}
    const startingPlayer =
      partial.startingPlayer !== undefined
        ? asPlayerId(partial.startingPlayer, 'rules.startingPlayer')
        : (players[0]?.id ?? DEFAULT_RULES.startingPlayer)

    const rules = {
      startingPlayer,
      actionsPerTurn: positiveInt(
        partial.actionsPerTurn,
        'rules.actionsPerTurn',
        DEFAULT_RULES.actionsPerTurn,
      ),
      handSize: positiveInt(
        partial.handSize,
        'rules.handSize',
        DEFAULT_RULES.handSize,
      ),
      visibility: mergeVisibility(partial.visibility),
    }

    if (players.length && !players.some((p) => p.id === rules.startingPlayer)) {
      throw createConfigError(
        `rules.startingPlayer "${rules.startingPlayer}" отсутствует в players`,
      )
    }

    const options = { ...(setup.options ?? {}) }
    // seed здесь не принимаем из setup — только сервер в createGame
    delete options.seed

    return {
      map: { ...map },
      rules,
      options,
    }
  }

  return { normalizeGameSetup, DEFAULT_RULES }
}
