/** Универсальный жизненный цикл партии (не контент-фазы вроде placement/attack). */
export const PHASES = {
  gameStart: 'gameStart',
  turnStart: 'turnStart',
  turn: 'turn',
  turnEnd: 'turnEnd',
  gameEnd: 'gameEnd',
}

/** Фазы, на которых ждут игрока / UI. Остальные движок прогоняет сам. */
export const INTERACTIVE_PHASES = [PHASES.turn, PHASES.gameEnd]

/** Встроенные типы действий kernel. */
export const ACTION_TYPES = {
  END_TURN: 'END_TURN',
  SPEND_ACTION: 'SPEND_ACTION',
}
