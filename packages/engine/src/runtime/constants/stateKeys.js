/**
 * Реестр ключей useState модуляса tabletop-engine.
 * Все клиентские useState только через эти константы.
 */
export const STATE_KEYS = {
  // Живая партия (useGameView)
  view: 'tabletop-engine:view',
  playerId: 'tabletop-engine:playerId',
  gameId: 'tabletop-engine:gameId',

  // Лобби / настройки партии (useGameSetup)
  setupId: 'tabletop-engine:setup:id',
  setupMap: 'tabletop-engine:setup:map',
  setupRules: 'tabletop-engine:setup:rules',
  setupOptions: 'tabletop-engine:setup:options',

  // Слоты игроков (usePlayerSetup)
  setupPlayers: 'tabletop-engine:setup:players',
}
