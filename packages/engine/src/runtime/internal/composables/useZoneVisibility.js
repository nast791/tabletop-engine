import {
  DEFAULT_VISIBILITY,
  RELATIONS,
  ZONES,
} from '../../constants/visibility.js'

const mergeZone = (base, patch) => {
  if (!patch || typeof patch !== 'object') return { ...base }
  return {
    cards: patch.cards !== undefined ? !!patch.cards : !!base.cards,
    count: patch.count !== undefined ? !!patch.count : !!base.count,
  }
}

const mergeRelation = (base, patch) => {
  const out = {}
  for (const zone of ZONES) {
    out[zone] = mergeZone(base[zone], patch?.[zone])
  }
  return out
}

/**
 * Внутренний composable: видимость зон + runtime-гранты эффектов.
 */
export const useZoneVisibility = () => {
  const mergeVisibility = (partial) => {
    const out = {}
    for (const relation of RELATIONS) {
      out[relation] = mergeRelation(
        DEFAULT_VISIBILITY[relation],
        partial?.[relation],
      )
    }
    return out
  }

  const getRelation = (viewer, owner) => {
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

  const findGrant = (grants, viewerId, ownerId, zone) =>
    (grants ?? []).find(
      (g) =>
        String(g.viewerId) === String(viewerId) &&
        String(g.ownerId) === String(ownerId) &&
        g.zone === zone,
    )

  /**
   * Что viewer видит в зоне owner.
   * Если открыты cards — count тоже (удобнее для UI).
   */
  const canSee = (state, viewerId, ownerId, zone) => {
    const players = state?.players ?? []
    const viewer = players.find((p) => String(p.id) === String(viewerId))
    const owner = players.find((p) => String(p.id) === String(ownerId))
    const relation = getRelation(viewer, owner)
    const base =
      state?.rules?.visibility?.[relation]?.[zone] ??
      DEFAULT_VISIBILITY[relation][zone]

    let cards = !!base.cards
    let count = !!base.count

    const grant = findGrant(state?.visibilityGrants, viewerId, ownerId, zone)
    if (grant) {
      const reveal = grant.reveal ?? 'both'
      if (reveal === 'cards' || reveal === 'both') cards = true
      if (reveal === 'count' || reveal === 'both') count = true
    }

    if (cards) count = true

    return { cards, count, relation }
  }

  const grantZoneVisibility = (state, params) => {
    const grant = {
      id:
        params.grantId ??
        `zone_${state.logSeq ?? 0}_${(state.visibilityGrants ?? []).length}`,
      viewerId: String(params.viewerId),
      ownerId: String(params.ownerId),
      zone: params.zone,
      reveal: params.reveal ?? 'both',
      requireConfirm: !!params.requireConfirm,
      until: params.until,
    }

    const prev = state.visibilityGrants ?? []
    state.visibilityGrants = [
      ...prev.filter(
        (g) =>
          !(
            String(g.viewerId) === grant.viewerId &&
            String(g.ownerId) === grant.ownerId &&
            g.zone === grant.zone
          ),
      ),
      grant,
    ]
    return grant
  }

  const revokeZoneVisibility = (state, params = {}) => {
    const before = state.visibilityGrants?.length ?? 0
    state.visibilityGrants = (state.visibilityGrants ?? []).filter((g) => {
      if (params.grantId && g.id !== params.grantId) return true
      if (params.ownerId != null && String(g.ownerId) !== String(params.ownerId))
        return true
      if (params.zone && g.zone !== params.zone) return true
      if (
        params.viewerId != null &&
        String(g.viewerId) !== String(params.viewerId)
      ) {
        return true
      }
      return false
    })
    return before - (state.visibilityGrants?.length ?? 0)
  }

  return {
    ZONES,
    RELATIONS,
    DEFAULT_VISIBILITY,
    mergeVisibility,
    getRelation,
    canSee,
    grantZoneVisibility,
    revokeZoneVisibility,
  }
}
