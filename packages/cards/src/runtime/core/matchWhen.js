/**
 * Проверка `when` на шаге эффекта.
 * - отсутствует / null → шаг выполняется
 * - function(ctx) → boolean
 * - object → каждое поле должно совпасть с ctx.facts[key] ?? ctx[key]
 */
export const matchWhen = (when, ctx = {}) => {
  if (when == null) return true
  if (typeof when === 'function') return Boolean(when(ctx))
  if (typeof when !== 'object') return true

  const facts =
    ctx.facts && typeof ctx.facts === 'object' ? ctx.facts : ctx

  for (const [key, expected] of Object.entries(when)) {
    if (facts[key] !== expected) return false
  }
  return true
}
