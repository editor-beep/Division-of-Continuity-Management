## CaseLoader.gd
## Loads and manages case data from JSON files in data/cases/.
## Autoloaded singleton. Provides filtered case lists based on
## current day, clearance level, and completion status.
extends Node

const CASE_DATA_PATHS := {
	1: "res://data/cases/day_01.json",
	2: "res://data/cases/day_02.json",
	3: "res://data/cases/day_03.json",
}

## Cache: day_number → Array of case dicts
var _cache: Dictionary = {}

signal cases_loaded(day: int)

func _ready() -> void:
	pass

# ── Public API ────────────────────────────────────────────────────────────────

## Return all cases available for the given day, filtered by clearance.
func get_cases_for_day(day: int) -> Array:
	_ensure_loaded(day)
	var all_cases: Array = _cache.get(day, {}).get("cases", [])
	var clearance: int = ContinuityState.clearance_level
	var completed: Array = ContinuityState.completed_cases
	var result: Array = []
	for case_data: Dictionary in all_cases:
		if case_data.get("clearance_required", 1) > clearance:
			continue
		# Return cases only appear when their prerequisite flag is set
		var prereq: String = case_data.get("requires_flag", "")
		if prereq != "" and not ContinuityState.has_flag(prereq):
			continue
		# Skip already-completed cases unless they are explicit return cases
		var is_return: bool = case_data.get("is_return_case", false)
		var case_id: String = case_data.get("id", "")
		if not is_return and case_id in completed:
			continue
		result.append(case_data)
	return result

## Retrieve a single case dict by ID across all loaded days.
func get_case_by_id(case_id: String) -> Dictionary:
	for day in _cache:
		for case_data: Dictionary in _cache[day].get("cases", []):
			if case_data.get("id", "") == case_id:
				return case_data
	# Try to load it if not cached
	for day in CASE_DATA_PATHS:
		_ensure_loaded(day)
		for case_data: Dictionary in _cache.get(day, {}).get("cases", []):
			if case_data.get("id", "") == case_id:
				return case_data
	push_warning("CaseLoader: Case '%s' not found." % case_id)
	return {}

## Return the opening text for a given day.
func get_day_opening(day: int) -> String:
	_ensure_loaded(day)
	return _cache.get(day, {}).get("opening_text", "")

## Preload all days into memory.
func preload_all() -> void:
	for day in CASE_DATA_PATHS:
		_ensure_loaded(day)

# ── Private ───────────────────────────────────────────────────────────────────

func _ensure_loaded(day: int) -> void:
	if day in _cache:
		return
	var path: String = CASE_DATA_PATHS.get(day, "")
	if path == "":
		push_warning("CaseLoader: No data path defined for day %d" % day)
		return
	if not FileAccess.file_exists(path):
		push_error("CaseLoader: File not found: %s" % path)
		return
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		push_error("CaseLoader: Could not open file: %s" % path)
		return
	var text: String = file.get_as_text()
	file.close()
	var data: Variant = JSON.parse_string(text)
	if data == null or not data is Dictionary:
		push_error("CaseLoader: Malformed JSON in %s" % path)
		return
	_cache[day] = data
	cases_loaded.emit(day)
