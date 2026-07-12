/**
 * Прогнать triggers[] против реестра facts.
 * Дескриптор: { fact, params?, min?, var? | as? }
 */
export const triggersNeedAnswer = (triggers = []) =>
  (triggers ?? []).some(t => String(t?.fact) === 'ANSWER')

const varName = item => {
  if (item?.var != null && item.var !== '') return String(item.var)
  if (item?.as != null && item.as !== '') return String(item.as)
  return null
}

export const evaluateTriggers = (triggers = [], ctx = {}, facts = {}) => {
  const vars = { ...(ctx.vars && typeof ctx.vars === 'object' ? ctx.vars : {}) }

  for (const item of triggers) {
    if (!item || typeof item !== 'object') {
      throw new Error('cards: triggers — элемент должен быть объектом')
    }
    const name = item.fact
    if (name == null || name === '') {
      throw new Error('cards: triggers — у элемента обязателен fact')
    }
    const fn = facts[name]
    if (typeof fn !== 'function') {
      throw new Error(`cards: неизвестный fact "${name}"`)
    }

    const result = fn({ ...ctx, vars }, item.params ?? {}, item)
    if (!result || result.ok !== true) {
      return { ok: false, vars }
    }

    const value = result.value
    if (item.min != null && Array.isArray(value)) {
      if (value.length < Number(item.min)) {
        return { ok: false, vars }
      }
    }
    const key = varName(item)
    if (key) vars[key] = value
  }

  return { ok: true, vars }
}
