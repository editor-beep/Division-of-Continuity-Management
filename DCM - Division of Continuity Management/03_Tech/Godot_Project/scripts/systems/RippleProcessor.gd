## RippleProcessor.gd
## Resolves the pending_ripples queue at end-of-day.
## Autoloaded singleton.
## Ripples are classified as small, medium, or major:
##   small  → flavor text only
##   medium → flavor text + stat modifications
##   major  → stat modifications + event flag + possible case unlock
extends Node

signal ripples_resolved(resolved: Array)
signal ripple_event(ripple: Dictionary)

# ── Public API ────────────────────────────────────────────────────────────────

## Process all pending ripples and return a list of resolution summaries.
## Call this at end-of-day before advancing.
func resolve_all() -> Array:
	var resolved: Array = []
	var pending_queue: Array = ContinuityState.pending_ripples.duplicate(true)
	ContinuityState.pending_ripples.clear()

	for ripple: Dictionary in pending_queue:
		var summary: Dictionary = _resolve_ripple(ripple)
		resolved.append(summary)

	ripples_resolved.emit(resolved)
	return resolved

## Add a single ripple to the queue (delegates to ContinuityState).
func queue(ripple: Dictionary) -> void:
	ContinuityState.queue_ripple(ripple)

# ── Private ───────────────────────────────────────────────────────────────────

func _resolve_ripple(ripple: Dictionary) -> Dictionary:
	var rtype: String = ripple.get("type", "small")
	var text: String  = ripple.get("text", "")
	var delayed_effects: Dictionary = ripple.get("delayed_effects", {})
	var unlocks_case: String = ripple.get("unlocks_case", "")
	var ending_flag: String  = ripple.get("ending_flag", "")
	var set_flags: Array     = ripple.get("flags_set", [])

	# Apply delayed stat effects
	if not delayed_effects.is_empty():
		ContinuityState.apply_effects(delayed_effects)

	# Set any flags carried by this ripple
	for flag: String in set_flags:
		ContinuityState.set_flag(flag)

	# Set ending-path flags
	if ending_flag != "":
		ContinuityState.set_flag(ending_flag)

	# Record case unlock (CaseLoader will pick it up via flag)
	if unlocks_case != "":
		ContinuityState.set_flag("unlock_" + unlocks_case)

	# Track unraveling events for major ripples
	if rtype == "major":
		ripple_event.emit(ripple)

	return {
		"type": rtype,
		"text": text,
		"effects_applied": delayed_effects,
		"flags_set": set_flags + ([ending_flag] if ending_flag != "" else []),
	}

## Build a small ripple dict for convenience.
static func small(text: String) -> Dictionary:
	return { "type": "small", "text": text }

## Build a medium ripple dict for convenience.
static func medium(text: String, effects: Dictionary) -> Dictionary:
	return { "type": "medium", "text": text, "delayed_effects": effects }

## Build a major ripple dict for convenience.
static func major(text: String, effects: Dictionary, flags: Array = []) -> Dictionary:
	return { "type": "major", "text": text, "delayed_effects": effects, "flags_set": flags }
