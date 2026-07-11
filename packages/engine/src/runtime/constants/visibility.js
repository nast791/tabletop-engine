export const ZONES = ['hand', 'deck', 'discard']

export const RELATIONS = ['self', 'teammate', 'enemy']

/** Дефолты видимости зон: self / teammate / enemy × cards / count. */
export const DEFAULT_VISIBILITY = {
  self: {
    hand: { cards: true, count: true },
    deck: { cards: false, count: true },
    discard: { cards: true, count: true },
  },
  teammate: {
    hand: { cards: false, count: true },
    deck: { cards: false, count: true },
    discard: { cards: true, count: true },
  },
  enemy: {
    hand: { cards: false, count: true },
    deck: { cards: false, count: true },
    discard: { cards: true, count: true },
  },
}
