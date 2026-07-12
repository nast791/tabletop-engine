import { describe, expect, it } from 'vitest'
import { useCreateGame } from '../src/runtime/internal/composables/useCreateGame.js'
import { useApply } from '../src/runtime/internal/composables/useApply.js'
import { useGetView } from '../src/runtime/internal/composables/useGetView.js'
import { usePhaseMachine } from '../src/runtime/internal/composables/usePhaseMachine.js'
import { ACTION_TYPES } from '../src/runtime/constants/actions.js'
import { PHASES } from '../src/runtime/constants/phases.js'

const { createGame } = useCreateGame()
const { apply } = useApply()
const { getView } = useGetView()
const { drainPhases } = usePhaseMachine()

/** create останавливается на gameStart; для kernel-ходов нужен turn. */
const enterTurn = (state) =>
  drainPhases({
    ...state,
    phase: PHASES.turnStart,
  })

const baseConfig = () => ({
  map: { id: 't' },
  players: [{ id: '0' }, { id: '1' }],
  rules: { actionsPerTurn: 2, startingPlayer: '0', handSize: 5 },
})

describe('createGame', () => {
  it('создаёт партию в gameStart', () => {
    const state = createGame(baseConfig())
    expect(state.phase).toBe(PHASES.gameStart)
    expect(state.currentPlayer).toBe('0')
    expect(state.winner).toBe(false)
    expect(state.options.seed).toBeTruthy()
    expect(state.id).toBeTruthy()
  })

  it('раздаёт hand только при card-зонах', () => {
    const withCards = createGame({
      map: {},
      players: [
        { id: '0', deck: [1, 2, 3, 4], hand: [] },
        { id: '1' },
      ],
      rules: { handSize: 2, startingPlayer: '0' },
    })
    expect(withCards.players[0].hand).toHaveLength(2)
    expect(withCards.players[0].deck).toHaveLength(2)
    expect(withCards.players[1].hand).toBeUndefined()
  })
})

describe('apply kernel', () => {
  it('END_TURN меняет currentPlayer', () => {
    let state = enterTurn(createGame(baseConfig()))
    expect(state.phase).toBe(PHASES.turn)
    expect(state.actionsLeft).toBe(2)

    state = apply(state, {
      type: ACTION_TYPES.END_TURN,
      playerId: '0',
    })
    expect(state.currentPlayer).toBe('1')
    expect(state.turn).toBe(1)
    expect(state.phase).toBe(PHASES.turn)
  })

  it('SPEND_ACTION при 0 AP → смена хода', () => {
    let state = enterTurn(createGame(baseConfig()))
    state = apply(state, {
      type: ACTION_TYPES.SPEND_ACTION,
      playerId: '0',
    })
    expect(state.actionsLeft).toBe(1)
    state = apply(state, {
      type: ACTION_TYPES.SPEND_ACTION,
      playerId: '0',
    })
    expect(state.currentPlayer).toBe('1')
    expect(state.actionsLeft).toBe(2)
  })

  it('SET_WINNER → gameEnd', () => {
    let state = enterTurn(createGame(baseConfig()))
    state = apply(state, {
      type: ACTION_TYPES.SET_WINNER,
      playerId: '0',
      winner: '1',
    })
    expect(state.phase).toBe(PHASES.gameEnd)
    expect(state.winner).toBe('1')
  })

  it('RESIGN (2 игрока) → побеждает второй', () => {
    let state = enterTurn(createGame(baseConfig()))
    state = apply(state, {
      type: ACTION_TYPES.RESIGN,
      playerId: '1',
    })
    expect(state.phase).toBe(PHASES.gameEnd)
    expect(state.winner).toBe('0')
  })

  it('в gameStart kernel END_TURN запрещён', () => {
    const state = createGame(baseConfig())
    expect(() =>
      apply(state, { type: ACTION_TYPES.END_TURN, playerId: '0' }),
    ).toThrow(/gameStart/)
  })
})

describe('getView', () => {
  it('отдаёт phase / actionsLeft без seed в view', () => {
    const state = enterTurn(createGame(baseConfig()))
    const view = getView(state, '0')
    expect(view.you).toBe('0')
    expect(view.phase).toBe(PHASES.turn)
    expect(view.actionsLeft).toBe(2)
    expect(view).not.toHaveProperty('options')
    expect(state.options.seed).toBeTruthy()
  })
})
