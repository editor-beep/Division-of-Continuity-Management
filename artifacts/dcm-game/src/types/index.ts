export type NumericStatKey =
  | 'dissolution_index'
  | 'efficiency_score'
  | 'continuity_contribution'
  | 'mythic_residue'
  | 'narrative_stability'
  | 'emotional_surplus'
  | 'reality_stability'
  | 'department_strain'
  | 'unraveling_events'
  | 'mythic_commodities_index'
  | 'collective_nostalgia';

export type GamePhase = 'boot' | 'terminal' | 'case' | 'end_of_day' | 'player_file' | 'ending';
export type Era = 'Act1' | 'Act2' | 'Act3';
export type RippleType = 'small' | 'medium' | 'major';

export interface Ripple {
  type: RippleType;
  text: string;
  delayed_effects?: Record<string, number>;
}

export interface StatSnapshot {
  dissolution_index: number;
  efficiency_score: number;
  mythic_residue: number;
  narrative_stability: number;
  emotional_surplus: number;
  reality_stability: number;
  department_strain: number;
}

export interface GameState {
  dissolution_index: number;
  efficiency_score: number;
  continuity_contribution: number;
  clearance_level: number;
  mythic_residue: number;
  narrative_stability: number;
  emotional_surplus: number;

  reality_stability: number;
  department_strain: number;
  unraveling_events: number;
  mythic_commodities_index: number;
  collective_nostalgia: number;

  era: Era;
  current_day: number;
  daily_cases_processed: number;
  completed_cases: string[];
  deferred_cases: string[];
  rejected_cases: string[];
  flags: Record<string, boolean>;
  pending_ripples: Ripple[];
  game_phase: GamePhase;
  active_ending: string | null;
  active_case_id: string | null;
  echo_interactions: number;
  play_count: number;

  completeCase: (
    caseId: string,
    effects: Record<string, number>,
    flags_to_set: string[],
    ripples: Ripple[]
  ) => void;
  rejectCase: (caseId: string) => void;
  deferCase: (caseId: string) => void;
  applyStat: (key: NumericStatKey, delta: number) => void;
  setFlag: (key: string, value?: boolean) => void;
  hasFlag: (key: string) => boolean;
  queueRipple: (ripple: Ripple) => void;
  resolveRipple: () => void;
  evaluateEnding: () => string;
  advanceDay: () => void;
  triggerEnding: (endingId: string) => void;
  resetGame: () => void;
  setGamePhase: (phase: GamePhase) => void;
  setActiveCase: (caseId: string | null) => void;
  snapshotStats: () => StatSnapshot;
}

export interface WorkerUnit {
  id: string;
  name: string;
  age: number;
  occupation: string;
}

export interface BaseField {
  id: string;
  label: string;
  description?: string;
}

export interface ChoiceOption {
  id: string;
  label: string;
  sublabel?: string;
  effects: Record<string, number>;
  flags_set: string[];
  ripples: Ripple[];
}

export interface ChoiceField extends BaseField {
  type: 'choice';
  required: boolean;
  options: ChoiceOption[];
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

export type Field = ChoiceField | SliderField | TextField | ToggleField;

export interface Section {
  id: string;
  title: string;
  fields: Field[];
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
  worker_unit: WorkerUnit;
  issue: string;
  system_note: string;
  sections: Section[];
  completion_flag: string;
  unlocks_on_completion: string[];
}
