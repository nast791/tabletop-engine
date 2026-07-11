/**
 * Хуки жизненного цикла фазы.
 * Сейчас no-op; позже хост сможет подменить (добор карт и т.п.).
 */
export const NOOP_PHASE_HOOKS = {
  onGameStart: (state) => state,
  onTurnStart: (state) => state,
  onTurnEnd: (state) => state,
  onGameEnd: (state) => state,
}

export const mergePhaseHooks = (partial = {}) => ({
  ...NOOP_PHASE_HOOKS,
  ...partial,
})
