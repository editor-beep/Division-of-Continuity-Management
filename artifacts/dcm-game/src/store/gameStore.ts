import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, NumericStatKey, Ripple, StatSnapshot } from '../types';

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

const INITIAL_NUMERIC = {
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
};

const initialState = {
  ...INITIAL_NUMERIC,
  era:                   'Act1' as const,
  current_day:           1,
  daily_cases_processed: 0,
  completed_cases:       [] as string[],
  deferred_cases:        [] as string[],
  rejected_cases:        [] as string[],
  flags:                 {} as Record<string, boolean>,
  pending_ripples:       [] as Ripple[],
  game_phase:            'boot' as const,
  active_ending:         null as string | null,
  active_case_id:        null as string | null,
  echo_interactions:     0,
  play_count:            0,
};

const ECHO_CASE_IDS = ['case_005', 'case_010', 'case_015'];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      applyStat: (key: NumericStatKey, delta: number) =>
        set((state) => ({
          [key]: clamp(key, (state[key] as number) + delta),
        })),

      setFlag: (key: string, value = true) =>
        set((state) => ({ flags: { ...state.flags, [key]: value } })),

      hasFlag: (key: string) => get().flags[key] === true,

      queueRipple: (ripple: Ripple) =>
        set((state) => ({ pending_ripples: [...state.pending_ripples, ripple] })),

      snapshotStats: (): StatSnapshot => {
        const s = get();
        return {
          dissolution_index:   s.dissolution_index,
          efficiency_score:    s.efficiency_score,
          mythic_residue:      s.mythic_residue,
          narrative_stability: s.narrative_stability,
          emotional_surplus:   s.emotional_surplus,
          reality_stability:   s.reality_stability,
          department_strain:   s.department_strain,
        };
      },

      evaluateEnding: (): string => {
        const s = get();
        const echoCompleted = ECHO_CASE_IDS.filter((id) =>
          s.completed_cases.includes(id)
        ).length;

        // Priority 1: THE UNRAVELING — total systemic collapse
        if (
          s.efficiency_score <= 25 &&
          s.reality_stability <= 30 &&
          s.unraveling_events >= 3
        ) return 'the_unraveling';

        // Priority 2: ECHO LOOP — must have awareness + all 3 echo cases processed
        if (
          s.flags['echo_awareness'] &&
          echoCompleted >= 3 &&
          s.echo_interactions >= 3
        ) return 'echo_loop';

        // Priority 3: MYTHIC ASCENSION — exceeded mythic thresholds
        if (s.mythic_residue >= 70 && s.dissolution_index >= 40)
          return 'mythic_ascension';

        // Priority 4: SYSTEM FRACTURE — structural breakdown
        if (s.department_strain >= 70 && s.unraveling_events >= 5)
          return 'system_fracture';

        // Priority 5: OPTIMAL ASSIMILATION — perfectly efficient dissolution
        if (
          s.dissolution_index >= 75 &&
          s.efficiency_score >= 85 &&
          s.mythic_residue <= 40
        ) return 'optimal_assimilation';

        // Priority 6: QUIET REBELLION — emotional resistance despite compliance
        if (s.emotional_surplus >= 20 && s.efficiency_score <= 55)
          return 'quiet_rebellion';

        // Priority 7: MERCIFUL ERASURE — sacrifice for others
        if (s.emotional_surplus >= 30 && s.flags['mercy_override_used'])
          return 'merciful_erasure';

        // Priority 8: CO-CREATOR — balanced dissolution + echo engagement + NG+ or
        // broad conditions (dissolution in [45-70], efficiency in [55-80], echo_awareness)
        if (
          s.dissolution_index >= 45 && s.dissolution_index <= 70 &&
          s.efficiency_score >= 55 && s.efficiency_score <= 80 &&
          (s.flags['echo_awareness'] || s.play_count >= 1)
        ) return 'co_creator';

        // Default fallback
        return 'quiet_rebellion';
      },

      completeCase: (caseId, effects, flags_to_set, ripples) =>
        set((state) => {
          if (state.completed_cases.includes(caseId)) return state;

          const base = getNumeric(state);
          const statPatch = applyEffects(base, effects);

          const newFlags: Record<string, boolean> = { ...state.flags };
          for (const key of flags_to_set) newFlags[key] = true;

          const isEchoCase = ECHO_CASE_IDS.includes(caseId);
          const nextDeptStrain = statPatch.department_strain ?? state.department_strain;
          const triggersUnravel = nextDeptStrain >= 60 && state.department_strain < 60;

          return {
            ...statPatch,
            flags: newFlags,
            pending_ripples: [...state.pending_ripples, ...ripples],
            completed_cases: [...state.completed_cases, caseId],
            rejected_cases:  state.rejected_cases.filter((id) => id !== caseId),
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

      rejectCase: (caseId: string) =>
        set((state) => {
          if (state.completed_cases.includes(caseId)) return state;
          const base = getNumeric(state);
          const statPatch = applyEffects(base, {
            efficiency_score:   -8.0,
            emotional_surplus:   5.0,
            reality_stability:   2.0,
            department_strain:   5.0,
          });
          const alreadyRejected = state.rejected_cases.includes(caseId);
          return {
            ...statPatch,
            rejected_cases: alreadyRejected
              ? state.rejected_cases
              : [...state.rejected_cases, caseId],
            deferred_cases: state.deferred_cases.filter((id) => id !== caseId),
            pending_ripples: [
              ...state.pending_ripples,
              {
                type: 'medium' as const,
                text: 'A rejection has been filed. The Continuum notes the refusal. It is, in its way, also a contribution.',
              },
            ],
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

      resetGame: () =>
        set((state) => ({
          ...initialState,
          play_count: state.play_count + 1,
        })),

      setGamePhase: (phase) => set({ game_phase: phase }),

      setActiveCase: (caseId) => set({ active_case_id: caseId }),
    }),
    { name: 'dcm-game-state-v2' }
  )
);
