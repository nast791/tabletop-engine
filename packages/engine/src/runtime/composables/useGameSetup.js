import { useState } from 'nuxt/app'
import { DEFAULT_VISIBILITY } from '../constants/visibility.js'
import { STATE_KEYS } from '../constants/stateKeys.js'

const defaultRules = () => ({
  startingPlayer: '0',
  actionsPerTurn: 2,
  handSize: 5,
  visibility: structuredClone(DEFAULT_VISIBILITY),
})

/**
 * Внешний composable: настройки партии (map, rules, options).
 * id выставляется после create (сервер); seed в проект не кладём.
 */
export const useGameSetup = () => {
  const id = useState(STATE_KEYS.setupId, () => null)
  const map = useState(STATE_KEYS.setupMap, () => null)
  const rules = useState(STATE_KEYS.setupRules, () => defaultRules())
  const options = useState(STATE_KEYS.setupOptions, () => ({}))

  const setId = (value) => {
    id.value = value == null ? null : String(value)
  }

  const setMap = (value) => {
    map.value = value
  }

  const setRules = (patch) => {
    rules.value = {
      ...rules.value,
      ...patch,
      visibility:
        patch?.visibility !== undefined
          ? {
              ...rules.value.visibility,
              ...patch.visibility,
              self: {
                ...rules.value.visibility.self,
                ...patch.visibility?.self,
              },
              teammate: {
                ...rules.value.visibility.teammate,
                ...patch.visibility?.teammate,
              },
              enemy: {
                ...rules.value.visibility.enemy,
                ...patch.visibility?.enemy,
              },
            }
          : rules.value.visibility,
    }
  }

  const setVisibility = (relation, zone, patch) => {
    rules.value = {
      ...rules.value,
      visibility: {
        ...rules.value.visibility,
        [relation]: {
          ...rules.value.visibility[relation],
          [zone]: {
            ...rules.value.visibility[relation][zone],
            ...patch,
          },
        },
      },
    }
  }

  const setOptions = (patch) => {
    const next = { ...options.value, ...patch }
    delete next.seed
    options.value = next
  }

  const reset = () => {
    id.value = null
    map.value = null
    rules.value = defaultRules()
    options.value = {}
  }

  const isReady = () => !!map.value && typeof map.value === 'object'

  const toObject = () => {
    const opts = { ...options.value }
    delete opts.seed
    return {
      map: map.value,
      rules: { ...rules.value },
      options: opts,
    }
  }

  return {
    id,
    map,
    rules,
    options,
    setId,
    setMap,
    setRules,
    setVisibility,
    setOptions,
    reset,
    isReady,
    toObject,
  }
}
