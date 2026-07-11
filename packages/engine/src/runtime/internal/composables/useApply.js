/**
 * Внутренний composable: ход → новое состояние.
 * Не автоимпортируется в целевой проект.
 */
export const useApply = () => {
  const apply = (state, action) => {
    if (!state || typeof state !== 'object') {
      throw new Error('state должен быть объектом')
    }
    if (!action || typeof action !== 'object' || !action.type) {
      throw new Error('action.type обязателен')
    }
    if (String(action.playerId) !== String(state.currentPlayer)) {
      throw new Error(
        `action.playerId "${action.playerId}" не совпадает с currentPlayer "${state.currentPlayer}"`,
      )
    }

    // Заглушка: мелкое клонирование, чтобы у вызывающего была новая ссылка.
    return {
      ...state,
      players: state.players.map((p) => ({ ...p })),
      map: { ...state.map },
      rules: { ...state.rules },
      options: { ...state.options },
    }
  }

  return { apply }
}
