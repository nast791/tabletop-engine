import { computed } from 'vue'
import { useGameView } from './useGameView.js'

/**
 * Внешний composable: computed и хелперы поверх view.
 * Не пишет в API — только читает useGameView().
 */
export const useGameHelpers = () => {
  const { view, playerId } = useGameView()

  const you = computed(() => view.value?.you ?? playerId.value ?? null)

  const currentPlayerId = computed(() =>
    view.value?.currentPlayer != null ? String(view.value.currentPlayer) : null,
  )

  const players = computed(() => view.value?.players ?? [])

  const findPlayer = (id) => {
    if (id == null) return null
    return players.value.find((p) => String(p.id) === String(id)) ?? null
  }

  const me = computed(() => findPlayer(you.value))

  const currentPlayer = computed(() => findPlayer(currentPlayerId.value))

  const isMyTurn = computed(() => {
    if (you.value == null || currentPlayerId.value == null) return false
    return String(you.value) === String(currentPlayerId.value)
  })

  const turn = computed(() => view.value?.turn ?? 0)

  const winner = computed(() => view.value?.winner ?? false)

  const hasWinner = computed(() => winner.value !== false && winner.value != null)

  const relationTo = (playerIdOrPlayer) => {
    const ownerId =
      playerIdOrPlayer != null && typeof playerIdOrPlayer === 'object'
        ? playerIdOrPlayer.id
        : playerIdOrPlayer
    const viewer = me.value
    const owner = findPlayer(ownerId)
    if (!viewer || !owner) return 'enemy'
    if (String(viewer.id) === String(owner.id)) return 'self'
    if (
      viewer.team != null &&
      owner.team != null &&
      String(viewer.team) === String(owner.team)
    ) {
      return 'teammate'
    }
    return 'enemy'
  }

  const isMe = (playerIdOrPlayer) => relationTo(playerIdOrPlayer) === 'self'

  const isTeammate = (playerIdOrPlayer) =>
    relationTo(playerIdOrPlayer) === 'teammate'

  const isEnemy = (playerIdOrPlayer) => relationTo(playerIdOrPlayer) === 'enemy'

  const teammates = computed(() =>
    players.value.filter((p) => relationTo(p) === 'teammate'),
  )

  const enemies = computed(() =>
    players.value.filter((p) => relationTo(p) === 'enemy'),
  )

  const opponents = computed(() =>
    players.value.filter((p) => relationTo(p) !== 'self'),
  )

  const findFighterOwner = (fighterId) => {
    if (fighterId == null) return null
    for (const player of players.value) {
      const fighters = player.fighters ?? []
      if (fighters.some((f) => String(f.id) === String(fighterId))) {
        return player
      }
    }
    return null
  }

  const isMyFighter = (fighterId) => {
    const owner = findFighterOwner(fighterId)
    return owner ? isMe(owner) : false
  }

  const isEnemyFighter = (fighterId) => {
    const owner = findFighterOwner(fighterId)
    return owner ? isEnemy(owner) : false
  }

  const relationToFighter = (fighterId) => {
    const owner = findFighterOwner(fighterId)
    return owner ? relationTo(owner) : 'enemy'
  }

  const myHeroes = computed(() =>
    (me.value?.fighters ?? []).filter((f) => f.type === 'hero'),
  )

  const canSeeCards = (ownerId, zone) => {
    const player = findPlayer(ownerId)
    if (!player) return false
    const cards = player[zone]
    return Array.isArray(cards)
  }

  const zoneCount = (ownerId, zone) => {
    const player = findPlayer(ownerId)
    if (!player) return undefined
    const countKey = `${zone}Count`
    if (player[countKey] !== undefined) return player[countKey]
    const cards = player[zone]
    return Array.isArray(cards) ? cards.length : undefined
  }

  return {
    you,
    currentPlayerId,
    currentPlayer,
    me,
    players,
    isMyTurn,
    turn,
    winner,
    hasWinner,
    relationTo,
    isMe,
    isTeammate,
    isEnemy,
    teammates,
    enemies,
    opponents,
    findPlayer,
    findFighterOwner,
    isMyFighter,
    isEnemyFighter,
    relationToFighter,
    myHeroes,
    canSeeCards,
    zoneCount,
  }
}
