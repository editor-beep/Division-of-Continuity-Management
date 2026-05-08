export interface GameState {
  // Player state
  dissolution_index: number;
  efficiency_score: number;
  continuity_contribution: number;
  clearance_level: number;
  mythic_residue: number;
  narrative_stability: number;
  emotional_surplus: number;
  
  // World state
  reality_stability: number;
  department_strain: number;
  unraveling_events: number;
  mythic_commodities_index: number;
  collective_nostalgia: number;
  
  // Session state
  current_day: number;
  daily_cases_processed: number;
  completed_cases: string[];
  active_flags: string[];
  pending_ripples: Ripple[];
  game_phase: 'boot' | 'terminal' | 'case' | 'end_of_day' | 'player_file' | 'ending';
  active_ending: string | null;
  active_case_id: string | null;
  
  // Actions
  completeCase: (caseId: string, effects: Record<string, number>, flags: string[], ripples: Ripple[]) => void;
  advanceDay: () => void;
  triggerEnding: (endingId: string) => void;
  resetGame: () => void;
  setGamePhase: (phase: GameState['game_phase']) => void;
  setActiveCase: (caseId: string) => void;
  resolveRipple: () => void;
}

export interface Ripple {
  type: 'small' | 'medium' | 'major';
  text: string;
  delayed_effects?: Record<string, number>;
}

export interface Case {
  id: string;
  day: number;
  form_type: string;
  form_title: string;
  title: string;
  clearance_required: number;
  is_return_case: boolean;
  requires_flag: string;
  worker_unit: {
    id: string;
    name: string;
    age: number;
    occupation: string;
  };
  issue: string;
  system_note: string;
  sections: Section[];
  completion_flag: string;
  unlocks_on_completion: string[];
}

export interface Section {
  id: string;
  title: string;
  fields: Field[];
}

export type Field = ChoiceField | SliderField | TextField | ToggleField;

export interface BaseField {
  id: string;
  label: string;
  description?: string;
}

export interface ChoiceField extends BaseField {
  type: 'choice';
  required: boolean;
  options: Option[];
}

export interface Option {
  id: string;
  label: string;
  sublabel?: string;
  effects: Record<string, number>;
  flags_set: string[];
  ripples: Ripple[];
}

export interface SliderField extends BaseField {
  type: 'slider';
  min: number;
  max: number;
  default: number;
  effects_at_min: Record<string, number>;
  effects_at_max: Record<string, number>;
}

export interface TextField extends BaseField {
  type: 'text';
  placeholder?: string;
}

export interface ToggleField extends BaseField {
  type: 'toggle';
  toggle_label: string;
  effects_on: Record<string, number>;
  effects_off: Record<string, number>;
  ripples_on: Ripple[];
}
