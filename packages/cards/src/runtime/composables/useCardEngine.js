import { getCardEngine } from '../server/getCardEngine.js'

/**
 * Внешний composable: движок карт с эффектами из tabletopCards.effects.
 * Автоимпорт модуля @nast791/cards.
 */
export const useCardEngine = () => getCardEngine()
