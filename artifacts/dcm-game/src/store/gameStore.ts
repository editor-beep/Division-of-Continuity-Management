import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, NumericStatKey, Ripple } from '../types';

const CLAMP: Record<NumericStatKey, [number, number]> = {
  dissolution_index:        [0,   100],
  efficiency_score:         [0,   100],
  continuity_contribution:  [0,  1000],
  mythic_residue:           [0,   100],
  narrative_stability:      [0,   100],
  emotional_surplus:        [-100, 100],
  reality_stability:        [0,   100],
  department_strain:        [0,   100],
  unraveling_events:        [0,   Infinity],
  mythic_commodities_index: [0,   200],
  collective_nostalgia:     [0,   100],
};

function clamp(key: NumericStatKey, value: number): number {
  const [lo, hi] = CLAMP[key];
  return Math.max(lo, Math.min(hi, value));
}

type NumericSlice = Record<NumericStatKey, number>;

function getNumeric(state: GameState): NumericSlice {
  return {
    dissolution_index:        state.dissolution_index,
    efficiency_score:         state.efficiency_score,
    continuity_contribution:  state.continuity_contribution,
    mythic_residue:           state.mythic_residue,
    narrative_stability:      state.narrative_stability,
    emotional_surplus:        state.emotional_surplus,
    reality_stability:        state.reality_stability,
    department_strain:        state.department_strain,
    unraveling_events:        state.unraveling_events,
    mythic_commodities_index: state.mythic_commodities_index,
    collective_nostalgia:     state.collective_nostalgia,
  };
}

function applyEffects(
  base: NumericSlice,
  effects: Record<string, number>
): Partial<NumericSlice> {
  const patch: Partial<NumericSlice> = {};
  for (const [rawKey, delta] of Object.entries(effects)) {
    const key = rawKey as NumericStatKey;
    if (key in CLAMP) {
      patch[key] = clamp(key, base[key] + delta);
    }
  }
  return patch;
}

const initialState = {
  dissolution_index:        4.2,
  efficiency_score:         65.0,
  continuity_contribution:  0,
  clearance_level:          1,
  mythic_residue:           12.0,
  narrative_stability:      78.0,
  emotional_surplus:        8.0,
  reality_stability:        92.0,
  department_strain:        15.0,
  unraveling_events:        0,
  mythic_commodities_index: 100.0,
  collective_nostalgia:     45.0,
  era:                      'Act1' as const,
  current_day:              1,
  daily_cases_processed:    0,
  completed_cases:          [] as string[],
  deferred_cases:           [] as string[],
  flags:                    {} as Record<string, boolean>,
  pending_ripples:          [] as Ripple[],
  game_phase:               'boot' as const,
  active_ending:            null as string | null,
  active_case_id:           null as string | null,
  echo_interactions:        0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      applyStat: (key: NumericStatKey, delta: number) =>
        set((state) => ({
          [key]: clamp(key, state[key] as number + delta),
        })),

      setFlag: (key: string, value = true) =>
        set((state) => ({ flags: { ...state.flags, [key]: value } })),

      hasFlag: (key: string) => get().flags[key] === true,

      queueRipple: (ripple: Ripple) =>
        set((state) => ({ pending_ripples: [...state.pending_ripples, ripple] })),

      evaluateEnding: (): string => {
        const s = get();
        const echoIds = ['case_005', 'case_010', 'case_015'];
        const echoCount = echoIds.filter((id) => s.completed_cases.includes(id)).length;

        if (s.efficiency_score <= 25 && s.reality_stability <= 30 && s.unraveling_events >= 3)
          return 'the_unraveling';
        if (s.flags['echo_awareness'] && (echoCount >= 2 || s.echo_interactions >= 2))
          return 'echo_loop';
        if (s.mythic_residue >= 70 && s.dissolution_index >= 40)
          return 'mythic_ascension';
        if (s.department_strain >= 70 && s.unraveling_events >= 5)
          return 'system_fracture';
        if (s.dissolution_index >= 75 && s.efficiency_score >= 85 && s.mythic_residue <= 40)
          return 'optimal_assimilation';
        if (s.emotional_surplus >= 20 && s.efficiency_score <= 55)
          return 'quiet_rebellion';
        if (s.emotional_surplus >= 30 && s.flags['mercy_override_used'])
          return 'merciful_erasure';
        if (
          s.dissolution_index >= 45 && s.dissolution_index <= 70 &&
          s.efficiency_score >= 55 && s.efficiency_score <= 80
        )
          return 'co_creator';
        return 'quiet_rebellion';
      },

      completeCase: (caseId, effects, flags_to_set, ripples) =>
        set((state) => {
          if (state.completed_cases.includes(caseId)) return state;

          const base = getNumeric(state);
          const statPatch = applyEffects(base, effects);

          const newFlags: Record<string, boolean> = { ...state.flags };
          for (const key of flags_to_set) newFlags[key] = true;

          const isEchoCase =
            caseId === 'case_005' || caseId === 'case_010' || caseId === 'case_015';

          const nextDeptStrain = statPatch.department_strain ?? state.department_strain;
          const triggersUnravel = nextDeptStrain >= 60 && state.department_strain < 60;

          return {
            ...statPatch,
            flags: newFlags,
            pending_ripples: [...state.pending_ripples, ...ripples],
            completed_cases: [...state.completed_cases, caseId],
            deferred_cases:  state.deferred_cases.filter((id) => id !== caseId),
            daily_cases_processed: state.daily_cases_processed + 1,
            echo_interactions: isEchoCase
              ? state.echo_interactions + 1
              : state.echo_interactions,
            unraveling_events: triggersUnravel
              ? state.unraveling_events + 1
              : state.unraveling_events,
          };
        }),

      deferCase: (caseId: string) =>
        set((state) => ({
          deferred_cases: state.deferred_cases.includes(caseId)
            ? state.deferred_cases
            : [...state.deferred_cases, caseId],
          efficiency_score: clamp('efficiency_score', state.efficiency_score - 5),
        })),

      resolveRipple: () =>
        set((state) => {
          if (state.pending_ripples.length === 0) return state;
          const [head, ...rest] = state.pending_ripples;
          if (!head.delayed_effects) return { pending_ripples: rest };
          const base = getNumeric(state);
          const statPatch = applyEffects(base, head.delayed_effects);
          return { ...statPatch, pending_ripples: rest };
        }),

      advanceDay: () =>
        set((state) => {
          const nextDay = state.current_day + 1;
          return {
            current_day:           nextDay,
            clearance_level:       Math.min(nextDay, 3),
            era:                   nextDay === 2 ? ('Act2' as const) : ('Act3' as const),
            daily_cases_processed: 0,
            game_phase:            'terminal' as const,
          };
        }),

      triggerEnding: (endingId: string) =>
        set({ active_ending: endingId, game_phase: 'ending' }),

      resetGame: () => set({ ...initialState }),

      setGamePhase: (phase) => set({ game_phase: phase }),

      setActiveCase: (caseId) => set({ active_case_id: caseId }),
    }),
    { name: 'dcm-game-state-v2' }
  )
);
