/** Карточные зоны — опциональны; есть только если хост их передал. */
export const CARD_ZONES = ['hand', 'deck', 'discard']

/**
 * Поля kernel игрока, которые нормализует engine.
 * Всё остальное — открытый контент хоста / пака (items, heroes, class…).
 */
export const PLAYER_KERNEL_KEYS = ['id', 'team', ...CARD_ZONES]
