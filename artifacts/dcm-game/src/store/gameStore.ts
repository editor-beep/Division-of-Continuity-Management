import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Ripple } from '../types';

const initialState = {
  // Player state
  dissolution_index: 4.2,
  efficiency_score: 65.0,
  continuity_contribution: 0,
  clearance_level: 1,
  mythic_residue: 12.0,
  narrative_stability: 78.0,
  emotional_surplus: 8.0,
  
  // World state
  reality_stability: 92.0,
  department_strain: 15.0,
  unraveling_events: 0,
  mythic_commodities_index: 100.0,
  collective_nostalgia: 45.0,
  
  // Session state
  current_day: 1,
  daily_cases_processed: 0,
  completed_cases: [],
  active_flags: [],
  pending_ripples: [],
  game_phase: 'boot' as const,
  active_ending: null,
  active_case_id: null,
};

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...initialState,
      
      completeCase: (caseId, effects, flags, ripples) => set((state) => {
        const nextState = { ...state };
        
        // Apply effects
        for (const [key, value] of Object.entries(effects)) {
          if (key in nextState && typeof nextState[key as keyof GameState] === 'number') {
            (nextState as any)[key] += value;
          }
        }
        
        // Add flags
        const newFlags = flags.filter(f => !nextState.active_flags.includes(f));
        nextState.active_flags = [...nextState.active_flags, ...newFlags];
        
        // Add ripples
        nextState.pending_ripples = [...nextState.pending_ripples, ...ripples];
        
        // Update case tracking
        if (!nextState.completed_cases.includes(caseId)) {
            nextState.completed_cases = [...nextState.completed_cases, caseId];
        }
        nextState.daily_cases_processed += 1;
        
        return nextState;
      }),
      
      advanceDay: () => set((state) => ({
        current_day: state.current_day + 1,
        clearance_level: Math.min(state.current_day + 1, 3), // 1 -> 2, 2 -> 3
        daily_cases_processed: 0,
        game_phase: 'terminal'
      })),
      
      triggerEnding: (endingId) => set({
        active_ending: endingId,
        game_phase: 'ending'
      }),
      
      resetGame: () => set({ ...initialState }),
      
      setGamePhase: (phase) => set({ game_phase: phase }),
      
      setActiveCase: (caseId) => set({ active_case_id: caseId }),
      
      resolveRipple: () => set((state) => {
          if (state.pending_ripples.length === 0) return state;
          
          const rippleToResolve = state.pending_ripples[0];
          const remainingRipples = state.pending_ripples.slice(1);
          
          const nextState = { ...state, pending_ripples: remainingRipples };
          
          if (rippleToResolve.delayed_effects) {
             for (const [key, value] of Object.entries(rippleToResolve.delayed_effects)) {
                if (key in nextState && typeof nextState[key as keyof GameState] === 'number') {
                    (nextState as any)[key] += value;
                }
             }
          }
          
          return nextState;
      })
    }),
    {
      name: 'dcm-game-state',
    }
  )
);
