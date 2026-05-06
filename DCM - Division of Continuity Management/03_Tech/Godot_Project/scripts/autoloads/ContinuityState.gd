## ContinuityState.gd
## Central state manager — the nervous system of the Division.
## Autoloaded singleton. Every system reads and writes through here.
## All variable names map directly to State_Schema.json.
extends Node

# ── Player State ──────────────────────────────────────────────────────────────

var dissolution_index: float = 4.2
var efficiency_score: float = 65.0
var continuity_contribution: float = 0.0
var clearance_level: int = 1
var mythic_residue: float = 12.0
var narrative_stability: float = 78.0
var emotional_surplus: float = 8.0
var flags: Dictionary = {}

# Thematic tracks — dominant patterns across all decisions
var grief_handling_style: String = ""   # Commercialized / Repressed / Preserved / Weaponized
var childhood_policy: String = ""       # Fully_Compressed / Selectively_Preserved / Wild
var narrative_control: String = ""      # Strict / Balanced / Permissive
var self_treatment: String = ""         # Optimizing / Protective / Sabotaging
var echo_interactions: int = 0

# ── World / Global State ──────────────────────────────────────────────────────

var reality_stability: float = 92.0
var department_strain: float = 15.0
var unraveling_events: int = 0
var mythic_commodities_index: float = 100.0
var collective_nostalgia: float = 45.0
var era: String = "Act1"

# ── Session State ─────────────────────────────────────────────────────────────

var current_day: int = 1
var daily_cases_processed: int = 0
var daily_efficiency: float = 0.0
var active_case_id: String = ""
var pending_ripples: Array = []
var completed_cases: Array = []

# ── Derived / Computed ────────────────────────────────────────────────────────

## Visual stage of the player's portrait. 0 = human, 5 = geometric sigil.
var player_portrait_stage: int:
	get: return _calc_portrait_stage()

## Composite risk of a major unraveling event.
var unraveling_risk: float:
	get: return _calc_unraveling_risk()

# ── Signals ───────────────────────────────────────────────────────────────────

signal state_changed(key: String, new_value: Variant)
signal major_ripple_queued(resolution_data: Dictionary)
signal day_ended(day: int)
signal dissolution_threshold_crossed(threshold: float)
signal case_completed(case_id: String)

# ── Constants ─────────────────────────────────────────────────────────────────

const DISSOLUTION_THRESHOLDS := [30.0, 50.0, 70.0, 90.0]

const STAT_RANGES := {
	"dissolution_index":       [0.0,    100.0],
	"efficiency_score":        [0.0,    100.0],
	"continuity_contribution": [0.0,   1000.0],
	"mythic_residue":          [0.0,    100.0],
	"narrative_stability":     [0.0,    100.0],
	"emotional_surplus":       [-100.0, 100.0],
	"reality_stability":       [0.0,    100.0],
	"department_strain":       [0.0,    100.0],
	"mythic_commodities_index":[0.0,    200.0],
	"collective_nostalgia":    [0.0,    100.0],
}

var _crossed_thresholds: Array = []

# ── Lifecycle ─────────────────────────────────────────────────────────────────

func _ready() -> void:
	pass

# ── Public API ────────────────────────────────────────────────────────────────

## Set a stat by name and emit state_changed.
func set_stat(key: String, value: Variant) -> void:
	if not key in STAT_RANGES and key not in ["clearance_level", "unraveling_events",
			"echo_interactions", "current_day", "daily_cases_processed",
			"daily_efficiency", "era", "grief_handling_style",
			"childhood_policy", "narrative_control", "self_treatment"]:
		push_warning("ContinuityState.set_stat: Unknown key '%s'" % key)
		return
	if key in STAT_RANGES:
		var bounds: Array = STAT_RANGES[key]
		value = clampf(float(value), bounds[0], bounds[1])
	set(key, value)
	state_changed.emit(key, value)
	if key == "dissolution_index":
		_check_dissolution_thresholds()

## Add a delta to a numeric stat. Clamps to defined range.
func modify_stat(key: String, delta: float) -> void:
	var current = get(key)
	if current == null:
		push_warning("ContinuityState.modify_stat: Unknown key '%s'" % key)
		return
	set_stat(key, float(current) + delta)

## Set a boolean flag and emit state_changed.
func set_flag(flag_name: String, value: bool = true) -> void:
	flags[flag_name] = value
	state_changed.emit("flags." + flag_name, value)

## Query a boolean flag; defaults to false if not set.
func has_flag(flag_name: String) -> bool:
	return flags.get(flag_name, false)

## Apply a dictionary of stat deltas and flags from a case option.
func apply_effects(effects: Dictionary) -> void:
	for key in effects:
		var val = effects[key]
		if key.begins_with("flag:"):
			set_flag(key.substr(5), bool(val))
		elif key == "unraveling_events":
			unraveling_events += int(val)
			state_changed.emit("unraveling_events", unraveling_events)
		elif key == "echo_interactions":
			echo_interactions += int(val)
			state_changed.emit("echo_interactions", echo_interactions)
		else:
			modify_stat(key, float(val))

## Push a ripple onto the pending queue. Major ripples emit immediately.
func queue_ripple(ripple: Dictionary) -> void:
	pending_ripples.append(ripple)
	if ripple.get("type", "small") == "major":
		major_ripple_queued.emit(ripple)

## Mark a case as done, update session counters, and trigger auto-save.
func complete_case(case_id: String) -> void:
	if case_id not in completed_cases:
		completed_cases.append(case_id)
	daily_cases_processed += 1
	daily_efficiency += efficiency_score * 0.1
	active_case_id = ""
	case_completed.emit(case_id)
	SaveSystem.save_game()

## Set thematic track value, normalising contradictory entries.
func update_track(track: String, value: String) -> void:
	set(track, value)
	state_changed.emit(track, value)

## Advance to next day: emit day_ended, increment day, update clearance.
func advance_day() -> void:
	day_ended.emit(current_day)
	current_day += 1
	daily_cases_processed = 0
	daily_efficiency = 0.0
	_update_clearance_level()
	SaveSystem.save_game()

## Snapshot of all numeric stats for UI display and ending evaluation.
func get_all_stats() -> Dictionary:
	return {
		"dissolution_index": dissolution_index,
		"efficiency_score": efficiency_score,
		"continuity_contribution": continuity_contribution,
		"clearance_level": clearance_level,
		"mythic_residue": mythic_residue,
		"narrative_stability": narrative_stability,
		"emotional_surplus": emotional_surplus,
		"reality_stability": reality_stability,
		"department_strain": department_strain,
		"unraveling_events": unraveling_events,
		"mythic_commodities_index": mythic_commodities_index,
		"collective_nostalgia": collective_nostalgia,
		"echo_interactions": echo_interactions,
		"player_portrait_stage": player_portrait_stage,
		"unraveling_risk": unraveling_risk,
	}

## Full serialisation for save files.
func to_dict() -> Dictionary:
	return {
		"player": {
			"dissolution_index": dissolution_index,
			"efficiency_score": efficiency_score,
			"continuity_contribution": continuity_contribution,
			"clearance_level": clearance_level,
			"mythic_residue": mythic_residue,
			"narrative_stability": narrative_stability,
			"emotional_surplus": emotional_surplus,
			"flags": flags.duplicate(true),
			"grief_handling_style": grief_handling_style,
			"childhood_policy": childhood_policy,
			"narrative_control": narrative_control,
			"self_treatment": self_treatment,
			"echo_interactions": echo_interactions,
		},
		"world": {
			"reality_stability": reality_stability,
			"department_strain": department_strain,
			"unraveling_events": unraveling_events,
			"mythic_commodities_index": mythic_commodities_index,
			"collective_nostalgia": collective_nostalgia,
			"era": era,
		},
		"session": {
			"current_day": current_day,
			"daily_cases_processed": daily_cases_processed,
			"completed_cases": completed_cases.duplicate(),
			"pending_ripples": pending_ripples.duplicate(true),
		},
	}

## Full deserialisation from save file data.
func from_dict(data: Dictionary) -> void:
	var p: Dictionary = data.get("player", {})
	dissolution_index      = p.get("dissolution_index",      4.2)
	efficiency_score       = p.get("efficiency_score",       65.0)
	continuity_contribution= p.get("continuity_contribution", 0.0)
	clearance_level        = p.get("clearance_level",        1)
	mythic_residue         = p.get("mythic_residue",         12.0)
	narrative_stability    = p.get("narrative_stability",    78.0)
	emotional_surplus      = p.get("emotional_surplus",      8.0)
	flags                  = p.get("flags",                  {})
	grief_handling_style   = p.get("grief_handling_style",   "")
	childhood_policy       = p.get("childhood_policy",       "")
	narrative_control      = p.get("narrative_control",      "")
	self_treatment         = p.get("self_treatment",         "")
	echo_interactions      = p.get("echo_interactions",      0)

	var w: Dictionary = data.get("world", {})
	reality_stability         = w.get("reality_stability",          92.0)
	department_strain         = w.get("department_strain",          15.0)
	unraveling_events         = w.get("unraveling_events",          0)
	mythic_commodities_index  = w.get("mythic_commodities_index",   100.0)
	collective_nostalgia      = w.get("collective_nostalgia",       45.0)
	era                       = w.get("era",                        "Act1")

	var s: Dictionary = data.get("session", {})
	current_day            = s.get("current_day",            1)
	daily_cases_processed  = s.get("daily_cases_processed",  0)
	completed_cases        = s.get("completed_cases",        [])
	pending_ripples        = s.get("pending_ripples",        [])

	# Re-emit all stats so bound UI refreshes
	for key in STAT_RANGES:
		state_changed.emit(key, get(key))

# ── Private ───────────────────────────────────────────────────────────────────

func _calc_portrait_stage() -> int:
	if dissolution_index >= 80.0: return 5
	elif dissolution_index >= 60.0: return 4
	elif dissolution_index >= 40.0: return 3
	elif dissolution_index >= 25.0: return 2
	elif dissolution_index >= 10.0: return 1
	else: return 0

func _calc_unraveling_risk() -> float:
	var risk: float = 0.0
	risk += maxf(0.0, dissolution_index  - 50.0) * 0.5
	risk += maxf(0.0, department_strain  - 60.0) * 0.8
	risk += float(unraveling_events) * 5.0
	risk -= maxf(0.0, reality_stability  - 50.0) * 0.3
	risk -= maxf(0.0, narrative_stability - 50.0) * 0.2
	return clampf(risk, 0.0, 100.0)

func _check_dissolution_thresholds() -> void:
	for threshold: float in DISSOLUTION_THRESHOLDS:
		if dissolution_index >= threshold and threshold not in _crossed_thresholds:
			_crossed_thresholds.append(threshold)
			dissolution_threshold_crossed.emit(threshold)

func _update_clearance_level() -> void:
	var new_level: int = 1
	if current_day >= 2: new_level = 2
	if current_day >= 4: new_level = 3
	if current_day >= 6: new_level = 4
	if current_day >= 9: new_level = 5
	if new_level > clearance_level:
		clearance_level = new_level
		state_changed.emit("clearance_level", clearance_level)
