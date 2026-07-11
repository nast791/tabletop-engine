/** Универсальный жизненный цикл партии (не контент-фазы вроде attack). */
export const PHASES = {
  gameStart: 'gameStart',
  turnStart: 'turnStart',
  turn: 'turn',
  turnEnd: 'turnEnd',
  gameEnd: 'gameEnd',
}

/**
 * Фазы с ожиданием UI.
 * gameStart — расстановка / подготовка хоста; turn — ходы; gameEnd — итог.
 */
export const INTERACTIVE_PHASES = [PHASES.gameStart, PHASES.turn, PHASES.gameEnd]
