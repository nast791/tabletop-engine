// Ошибки конфигурации партии (внутренний composable).

export const useConfigError = () => {
  const createConfigError = (message) => {
    const error = new Error(message)
    error.name = 'ConfigError'
    return error
  }

  const isConfigError = (error) => error?.name === 'ConfigError'

  return { createConfigError, isConfigError }
}
