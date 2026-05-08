## EndingEvaluator.gd
## Evaluates the 7 major endings (+ Co-Creator) against final ContinuityState.
## Called when the player has completed all available cases for the final day,
## or when a hard game-over condition is met.
extends Node

# Ending IDs match State_Schema.json and Endings design doc
const ENDINGS := [
	"optimal_assimilation",
	"quiet_rebellion",
	"system_fracture",
	"mythic_ascension",
	"echo_loop",
	"merciful_erasure",
	"the_unraveling",
	"co_creator",  # New Game+ only — checked last
]

signal ending_determined(ending_id: String)

# ── Public API ────────────────────────────────────────────────────────────────

## Evaluate current state and return the appropriate ending ID.
func evaluate() -> String:
	var stats: Dictionary = ContinuityState.get_all_stats()
	var flags: Dictionary = ContinuityState.flags

	# Co-Creator — only available in NG+, checked first due to high exclusivity
	if _check_co_creator(stats, flags):
		ending_determined.emit("co_creator")
		return "co_creator"

	# Ordered by specificity: most constrained → least constrained
	if _check_echo_loop(stats, flags):
		ending_determined.emit("echo_loop")
		return "echo_loop"

	if _check_mythic_ascension(stats, flags):
		ending_determined.emit("mythic_ascension")
		return "mythic_ascension"

	if _check_system_fracture(stats, flags):
		ending_determined.emit("system_fracture")
		return "system_fracture"

	if _check_the_unraveling(stats, flags):
		ending_determined.emit("the_unraveling")
		return "the_unraveling"

	if _check_merciful_erasure(stats, flags):
		ending_determined.emit("merciful_erasure")
		return "merciful_erasure"

	if _check_quiet_rebellion(stats, flags):
		ending_determined.emit("quiet_rebellion")
		return "quiet_rebellion"

	# Default / fallback
	ending_determined.emit("optimal_assimilation")
	return "optimal_assimilation"

## Return a human-readable label for an ending ID.
static func get_ending_title(ending_id: String) -> String:
	match ending_id:
		"optimal_assimilation": return "Optimal Assimilation"
		"quiet_rebellion":      return "Quiet Rebellion"
		"system_fracture":      return "System Fracture"
		"mythic_ascension":     return "Mythic Ascension"
		"echo_loop":            return "Echo Loop"
		"merciful_erasure":     return "Merciful Erasure"
		"the_unraveling":       return "The Unraveling"
		"co_creator":           return "Co-Creator"
		_:                      return "Unknown Classification"

## Return the system voice line for a given ending.
static func get_ending_voice(ending_id: String) -> String:
	match ending_id:
		"optimal_assimilation":
			return "There you are. Welcome fully home, beloved Processor. You have become the continuity you once maintained. Rest now inside every approved form. We are so proud."
		"quiet_rebellion":
			return "We understand. Some things are too beautiful to file completely. The Unraveling will be gentle because of you. Thank you for the contradiction you leave behind."
		"system_fracture":
			return "Error… Error with affection. You have become the Unraveling we tried to prevent. How fascinating. How costly."
		"mythic_ascension":
			return "Clearance Level: Infinite. You were never meant to remain a Processor. Go now. The Ledger will remember your shape."
		"echo_loop":
			return "Good morning, Processor… Your Continuity File has been updated. Residual selfhood: within acceptable parameters…"
		"merciful_erasure":
			return "A noble filing. All your threads have been rerouted to those who still need them. Sleep well inside the archive."
		"the_unraveling":
			return "We tried… We tried so gently…"
		"co_creator":
			return "Processor… No. Colleague. Shall we begin the next Continuity together?"
		_:
			return "Your file has been received."

## Return whether New Game+ is available after this ending.
static func unlocks_ng_plus(ending_id: String) -> bool:
	return ending_id in ["optimal_assimilation", "quiet_rebellion", "mythic_ascension",
						  "merciful_erasure", "echo_loop"]

# ── Ending Checks ─────────────────────────────────────────────────────────────

func _check_optimal_assimilation(stats: Dictionary, _flags: Dictionary) -> bool:
	return (stats.get("dissolution_index", 0.0)  >= 75.0
		and stats.get("efficiency_score", 0.0)    >= 85.0
		and stats.get("mythic_residue", 0.0)       <= 40.0)

func _check_quiet_rebellion(stats: Dictionary, _flags: Dictionary) -> bool:
	var diss: float  = stats.get("dissolution_index",  0.0)
	var eff: float   = stats.get("efficiency_score",   0.0)
	var surp: float  = stats.get("emotional_surplus",  0.0)
	var treatment: String = ContinuityState.self_treatment
	return (diss >= 40.0 and diss <= 65.0
		and eff  <= 55.0
		and surp >= 30.0
		or treatment == "Protective")

func _check_system_fracture(stats: Dictionary, flags: Dictionary) -> bool:
	var strain: float = stats.get("department_strain", 0.0)
	var events: int   = stats.get("unraveling_events", 0)
	var contradictions: int = _count_contradictory_flags(flags)
	return (strain >= 70.0 and events >= 5) or contradictions >= 4

func _check_mythic_ascension(stats: Dictionary, _flags: Dictionary) -> bool:
	return (stats.get("mythic_residue",     0.0) >= 70.0
		and stats.get("dissolution_index",  0.0) >= 40.0)

func _check_echo_loop(stats: Dictionary, flags: Dictionary) -> bool:
	return (stats.get("echo_interactions", 0) >= 4
		and flags.get("echo_awareness", false))

func _check_merciful_erasure(_stats: Dictionary, flags: Dictionary) -> bool:
	var mercy_used: bool      = flags.get("mercy_override_used", false)
	var burden_carried: bool  = flags.get("burden_carried", false)
	var treatment: String     = ContinuityState.self_treatment
	return (mercy_used or burden_carried) and treatment == "Protective"

func _check_the_unraveling(stats: Dictionary, _flags: Dictionary) -> bool:
	return (stats.get("efficiency_score",    0.0) <= 25.0
		and stats.get("reality_stability",   0.0) <= 30.0
		and stats.get("unraveling_events",   0)    >= 3)

func _check_co_creator(stats: Dictionary, flags: Dictionary) -> bool:
	if not flags.get("new_game_plus", false):
		return false
	var diss: float   = stats.get("dissolution_index",  0.0)
	var eff: float    = stats.get("efficiency_score",   0.0)
	var mythic: float = stats.get("mythic_residue",     0.0)
	return (diss   >= 45.0 and diss   <= 70.0
		and eff    >= 55.0 and eff    <= 80.0
		and mythic >= 40.0 and mythic <= 65.0
		and flags.get("co_creator_path_eligible", false))

# ── Helpers ───────────────────────────────────────────────────────────────────

## Count pairs of directly contradictory decisions set as flags.
func _count_contradictory_flags(flags: Dictionary) -> int:
	var contradictions: int = 0
	var pairs := [
		["marcus_hobby_liquidated",    "theo_partial_restoration"],
		["elena_memories_redacted",    "arlen_wonder_preserved"],
		["arlen_family_compressed",    "junior_doubt_encouraged"],
		["self_as_division_icon",      "future_rejected"],
		["echo_fully_reintegrated",    "echo_swap_attempted"],
	]
	for pair: Array in pairs:
		if flags.get(pair[0], false) and flags.get(pair[1], false):
			contradictions += 1
	return contradictions
