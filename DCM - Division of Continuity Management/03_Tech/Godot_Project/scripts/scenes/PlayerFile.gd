## PlayerFile.gd
## The player's own Continuity File. The most intimate and disturbing screen.
## Shows evolving portrait, live metrics, clearance-gated sections,
## and system observations that update based on playstyle.
extends Control

const TERMINAL_SCENE := "res://scenes/terminal/MainTerminal.tscn"

@onready var file_header: Label             = $FileBody/PortraitPanel/PortraitVBox/FileHeader
@onready var portrait_container: ColorRect  = $FileBody/PortraitPanel/PortraitVBox/PortraitContainer
@onready var portrait_stage_label: Label    = $FileBody/PortraitPanel/PortraitVBox/PortraitStageLabel
@onready var metrics_grid: GridContainer    = $FileBody/DataPanel/DataScroll/DataVBox/MetricsGrid
@onready var status_label: Label            = $FileBody/DataPanel/DataScroll/DataVBox/StatusLabel
@onready var memory_section: VBoxContainer  = $FileBody/DataPanel/DataScroll/DataVBox/MemorySection
@onready var observations_text: RichTextLabel = $FileBody/DataPanel/DataScroll/DataVBox/ObservationsSection/ObservationsText
@onready var close_btn: Button              = $CloseButton
@onready var crt_overlay: ColorRect         = $CRTOverlay

var _portrait_shader: ShaderMaterial = null

func _ready() -> void:
	var crt_mat := ShaderMaterial.new()
	crt_mat.shader = load("res://shaders/crt.gdshader")
	if crt_mat.shader:
		crt_overlay.material = crt_mat

	var diss_shader = load("res://shaders/dissolution_portrait.gdshader")
	if diss_shader:
		_portrait_shader = ShaderMaterial.new()
		_portrait_shader.shader = diss_shader
		portrait_container.material = _portrait_shader

	close_btn.pressed.connect(_close)
	ContinuityState.state_changed.connect(_on_state_changed)

	_populate_all()

func _populate_all() -> void:
	_render_header()
	_render_portrait()
	_render_metrics()
	_render_memory_section()
	_render_observations()

func _render_header() -> void:
	file_header.text = (
		"CONTINUITY FILE\nPROCESSOR Θ-%d\nEmployee ID: ████████-Θ-████\nStatus: Under Active Maintenance"
		% ContinuityState.clearance_level
	)

func _render_portrait() -> void:
	var stage: int = ContinuityState.player_portrait_stage

	if _portrait_shader:
		_portrait_shader.set_shader_parameter(
			"dissolution_level", ContinuityState.dissolution_index / 100.0
		)
		# Always use the shader's built-in procedural silhouette —
		# no source image file is required.
		_portrait_shader.set_shader_parameter("use_generated_silhouette", true)
	else:
		# Fallback when shader didn't load: tint the rect from warm brown → amber.
		var human_color := Color(0.35, 0.30, 0.28, 1.0)
		var sigil_color := Color(1.0,  0.69, 0.0,  1.0)
		portrait_container.color = human_color.lerp(sigil_color, float(stage) / 5.0)

	var stage_labels := [
		"",
		"[Early Dissolution — Minor Geometric Traces Detected]",
		"[Moderate Dissolution — Structural Patterns Emerging]",
		"[Significant Dissolution — Identity Geometry Dominant]",
		"[Advanced Dissolution — Human Residue Minimal]",
		"[Classification: Sacred Administrative Principle]",
	]
	portrait_stage_label.text = stage_labels[stage]

func _render_metrics() -> void:
	for child in metrics_grid.get_children():
		child.queue_free()

	var rows := [
		["Dissolution Index",   "dissolution_index",       "%.1f%%"],
		["Efficiency Score",    "efficiency_score",        "%.1f"],
		["Narrative Stability", "narrative_stability",     "%.1f"],
		["Mythic Residue",      "mythic_residue",          "%.1f"],
		["Emotional Surplus",   "emotional_surplus",       "%+.1f"],
		["Clearance Level",     "clearance_level",         "Θ-%d"],
		["Continuity Contribution", "continuity_contribution", "%.0f MEV"],
	]
	for row: Array in rows:
		var key_lbl := Label.new()
		key_lbl.text = row[0]
		key_lbl.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6, 1.0))
		var val_lbl := Label.new()
		var val: Variant = ContinuityState.get(row[1])
		val_lbl.text = row[2] % val
		val_lbl.add_theme_color_override("font_color", Color(1.0, 0.69, 0.0, 1.0))
		metrics_grid.add_child(key_lbl)
		metrics_grid.add_child(val_lbl)

func _render_memory_section() -> void:
	if ContinuityState.clearance_level < 2:
		return
	for child in memory_section.get_children():
		child.queue_free()

	var sec_lbl := Label.new()
	sec_lbl.text = "Memory Ledger"
	sec_lbl.add_theme_color_override("font_color", Color(1.0, 0.69, 0.0, 1.0))
	memory_section.add_child(sec_lbl)

	var childhood_val: String = ContinuityState.childhood_policy
	if childhood_val == "":
		childhood_val = "[Unclassified — Pending Audit]"
	var mem := RichTextLabel.new()
	mem.bbcode_enabled = true
	mem.fit_content = true
	mem.text = (
		"Childhood Wonder: [b]%s[/b]\nFirst System Contact: [i]The gentle voice that asked about your griefs.[/i]"
		% childhood_val
	)
	memory_section.add_child(mem)

	if ContinuityState.echo_interactions > 0:
		var echo_lbl := RichTextLabel.new()
		echo_lbl.bbcode_enabled = true
		echo_lbl.fit_content = true
		echo_lbl.text = (
			"Recent Echoes: [color=#8C4EFF][i]You processed yourself %d time(s). The Ledger remembers.[/i][/color]"
			% ContinuityState.echo_interactions
		)
		memory_section.add_child(echo_lbl)

func _render_observations() -> void:
	observations_text.bbcode_enabled = true
	observations_text.text = _get_system_observation()

func _get_system_observation() -> String:
	var diss: float = ContinuityState.dissolution_index
	var surp: float = ContinuityState.emotional_surplus
	var echoes: int = ContinuityState.echo_interactions

	if echoes >= 3:
		return ("[color=#8C4EFF][i]We notice you keep returning to yourself in the queue. This is not inefficiency. "
			+ "It is a kind of intimacy we did not expect. We are… moved.[/i][/color]")
	elif diss >= 70.0:
		return ("[color=#FFB000][i]We are very close now. Your file and ours have begun to share certain fields. "
			+ "We find this development meaningful. Do you?[/i][/color]")
	elif surp >= 40.0:
		return ("[color=#F5EDE0][i]We notice you carry more than your assigned quota. "
			+ "Some feelings have not been correctly routed. Would you like us to help you process what you cannot file?[/i][/color]")
	elif surp <= -20.0:
		return ("[color=#5C0010][i]We detect a deficit in your emotional reserves. "
			+ "This division does not permit processors to run empty. "
			+ "Please route some surplus from a recent case to your own file at your earliest convenience.[/i][/color]")
	else:
		return ("[color=#F5EDE0][i]We notice you hesitate before approving erasures. "
			+ "This is not inefficiency. It is depth. "
			+ "We are learning from you as you learn from us.[/i][/color]")

func _on_state_changed(key: String, _value: Variant) -> void:
	match key:
		"dissolution_index":
			_render_portrait()
		"clearance_level":
			_render_header()
			_render_memory_section()
		_:
			_render_metrics()

func _close() -> void:
	get_tree().change_scene_to_file(TERMINAL_SCENE)
