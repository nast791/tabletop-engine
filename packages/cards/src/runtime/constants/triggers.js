/** Имена триггеров жизненного цикла карты. */
export const TRIGGERS = {
  onPlay: 'onPlay',
  onAttack: 'onAttack',
  onDefend: 'onDefend',
  onMove: 'onMove',
  onMoveConfirm: 'onMoveConfirm',
  onTurnStart: 'onTurnStart',
  onTurnEnd: 'onTurnEnd',
  onDiscard: 'onDiscard',
}

/** Базовые типы карт (хост может расширять своими строками). */
export const CARD_TYPES = {
  attack: 'attack',
  defense: 'defense',
  hybrid: 'hybrid',
  effect: 'effect',
}
