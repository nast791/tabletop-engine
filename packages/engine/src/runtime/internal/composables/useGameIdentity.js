/**
 * Внутренний: уникальный id партии (в проект) и seed (только сервер).
 */
export const useGameIdentity = () => {
  const createGameId = () => crypto.randomUUID()

  const createSeed = () => {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }

  /** Убрать seed из объекта options — клиенту / view не отдаём. */
  const stripSeed = (options = {}) => {
    const { seed: _seed, ...rest } = options
    return rest
  }

  return { createGameId, createSeed, stripSeed }
}
