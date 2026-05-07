## EndOfDaySummary.gd
## Resolves the ripple queue, displays stat changes and narrative summaries,
## offers end-of-day options, then advances to the next day or triggers endings.
extends Control

const TERMINAL_SCENE    := "res://scenes/terminal/MainTerminal.tscn"
const PLAYER_FILE_SCENE := "res://scenes/player_file/PlayerFile.tscn"
const ENDING_SCENE      := "res://scenes/endings/EndingScreen.tscn"

@onready var title_label: Label             = $ScrollContainer/ContentContainer/TitleLabel
@onready var stats_delta_container: VBoxContainer = $ScrollContainer/ContentContainer/StatsDeltaContainer
@onready var ripples_title: Label           = $ScrollContainer/ContentContainer/RipplesTitle
@onready var ripples_container: VBoxContainer = $ScrollContainer/ContentContainer/RipplesContainer
@onready var unlock_label: Label            = $ScrollContainer/ContentContainer/UnlockLabel
@onready var review_file_btn: Button        = $ScrollContainer/ContentContainer/ActionsContainer/ReviewFileButton
@onready var proceed_btn: Button            = $ScrollContainer/ContentContainer/ActionsContainer/ProceedButton
@onready var crt_overlay: ColorRect         = $CRTOverlay

var _stats_before: Dictionary = {}
var _resolved_ripples: Array = []

func _ready() -> void:
	# Snapshot stats before ripple resolution
	_stats_before = ContinuityState.get_all_stats().duplicate()

	# Apply CRT
	var crt_mat := ShaderMaterial.new()
	crt_mat.shader = load("res://shaders/crt.gdshader")
	if crt_mat.shader:
		crt_overlay.material = crt_mat

	# Resolve all pending ripples
	_resolved_ripples = RippleProcessor.resolve_all()

	review_file_btn.pressed.connect(_open_player_file)
	proceed_btn.pressed.connect(_proceed)

	_populate_ui()

func _populate_ui() -> void:
	var day: int = ContinuityState.current_day
	title_label.text = "— END OF DAY %d —\nContinuity Report" % day

	_populate_stats_delta()
	_populate_ripples()
	_populate_unlocks()

func _populate_stats_delta() -> void:
	for child in stats_delta_container.get_children():
		child.queue_free()

	var current_stats: Dictionary = ContinuityState.get_all_stats()
	var tracked_keys := [
		["dissolution_index",   "Dissolution Index"],
		["efficiency_score",    "Efficiency Score"],
		["narrative_stability", "Narrative Stability"],
		["reality_stability",   "Reality Stability"],
		["mythic_residue",      "Mythic Residue"],
		["emotional_surplus",   "Emotional Surplus"],
	]
	for entry: Array in tracked_keys:
		var key: String   = entry[0]
		var label: String = entry[1]
		var before: float = float(_stats_before.get(key, 0.0))
		var after: float  = float(current_stats.get(key, 0.0))
		var delta: float  = after - before
		if absf(delta) < 0.05:
			continue
		var row := HBoxContainer.new()
		var lbl := Label.new()
		lbl.text = label
		lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		lbl.add_theme_color_override("font_color", Color(0.961, 0.929, 0.878, 1.0))
		var val_lbl := Label.new()
		var sign: String = "+" if delta >= 0.0 else ""
		val_lbl.text = "%s%.1f  →  %.1f" % [sign, delta, after]
		val_lbl.add_theme_color_override(
			"font_color",
			Color(0.0, 0.722, 0.690, 1.0) if delta >= 0.0 else Color(0.36, 0.0, 0.063, 1.0)
		)
		row.add_child(lbl)
		row.add_child(val_lbl)
		stats_delta_container.add_child(row)

func _populate_ripples() -> void:
	for child in ripples_container.get_children():
		child.queue_free()

	if _resolved_ripples.is_empty():
		var lbl := Label.new()
		lbl.text = "No significant ripple activity detected."
		lbl.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6, 1.0))
		ripples_container.add_child(lbl)
		return

	ripples_title.text = "Notable Ripples:"
	for ripple: Dictionary in _resolved_ripples:
		var text: String  = ripple.get("text", "")
		var rtype: String = ripple.get("type", "small")
		if text == "":
			continue
		var lbl := RichTextLabel.new()
		lbl.bbcode_enabled = true
		lbl.fit_content = true
		lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		match rtype:
			"small":
				lbl.text = "• %s" % text
			"medium":
				lbl.text = "[color=#FFB000]◆[/color] %s" % text
			"major":
				lbl.text = "[color=#8C4EFF][b]★[/b][/color] %s" % text
		ripples_container.add_child(lbl)

func _populate_unlocks() -> void:
	var new_clearance: int = ContinuityState.clearance_level
	var old_clearance: int = int(_stats_before.get("clearance_level", new_clearance))
	if not is_instance_valid(unlock_label):
		return
	if new_clearance > old_clearance:
		unlock_label.text = (
			"CLEARANCE UPDATE: Θ-%d granted.\nNew form fields and case types are now available." % new_clearance
		)
		unlock_label.visible = true
	else:
		unlock_label.visible = false

func _open_player_file() -> void:
	get_tree().change_scene_to_file(PLAYER_FILE_SCENE)

func _proceed() -> void:
	# Check if the game should end (final day or critical state)
	if _should_trigger_ending():
		var ending_id: String = EndingEvaluator.evaluate()
		# Store ending for EndingScreen to read
		ContinuityState.set_flag("active_ending_" + ending_id)
		get_tree().change_scene_to_file(ENDING_SCENE)
		return

	# Advance to next day
	ContinuityState.advance_day()
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.5)
	tween.finished.connect(func() -> void:
		get_tree().change_scene_to_file(TERMINAL_SCENE)
	)

func _should_trigger_ending() -> bool:
	# Game ends after Day 3 in the current build, or if reality collapses
	if ContinuityState.current_day >= 3 and ContinuityState.daily_cases_processed >= 5:
		return true
	if ContinuityState.reality_stability <= 15.0:
		return true
	if ContinuityState.dissolution_index >= 98.0:
		return true
	return false
