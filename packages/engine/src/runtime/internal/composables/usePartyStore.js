/**
 * Внутренний composable: партии в памяти процесса Nitro.
 * Не автоимпортируется в целевой проект.
 */
const parties = new Map()

export const usePartyStore = () => {
  const saveParty = (state) => {
    parties.set(state.id, state)
  }

  const getParty = (id) => parties.get(id)

  const deleteParty = (id) => parties.delete(id)

  return { saveParty, getParty, deleteParty }
}
