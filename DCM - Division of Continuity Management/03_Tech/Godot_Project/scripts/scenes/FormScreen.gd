## FormScreen.gd
## The heart of the game. Renders the current case as an interactive form.
## Dynamically builds form fields from case JSON data.
## Applies effects to ContinuityState on submission.
extends Control

const TERMINAL_SCENE   := "res://scenes/terminal/MainTerminal.tscn"
const FORM_FIELD_SCENE := "res://scenes/components/FormField.tscn"

# ── Node References ───────────────────────────────────────────────────────────
@onready var employee_id_label: Label       = $TopBar/TopBarLayout/EmployeeIdLabel
@onready var clearance_label: Label         = $TopBar/TopBarLayout/ClearanceLabel
@onready var dissolution_bar: ProgressBar   = $TopBar/TopBarLayout/DissolutionBar
@onready var worker_portrait: VectorPortrait = $FormBody/LeftPanel/LeftVBox/PortraitContainer
@onready var worker_info_label: RichTextLabel = $FormBody/LeftPanel/LeftVBox/WorkerInfoLabel
@onready var form_type_label: Label         = $FormBody/CenterPanel/CenterScroll/FormContainer/FormHeader/FormTypeLabel
@onready var form_title_label: Label        = $FormBody/CenterPanel/CenterScroll/FormContainer/FormHeader/FormTitleLabel
@onready var issue_label: RichTextLabel     = $FormBody/CenterPanel/CenterScroll/FormContainer/FormHeader/IssueLabel
@onready var fields_container: VBoxContainer= $FormBody/CenterPanel/CenterScroll/FormContainer/FieldsContainer
@onready var system_note_label: RichTextLabel= $FormBody/CenterPanel/CenterScroll/FormContainer/SystemNoteBox/SystemNoteLabel
@onready var preview_container: VBoxContainer = $FormBody/RightPanel/RightVBox/PreviewContainer
@onready var system_voice_label: RichTextLabel = $ActionBar/ActionLayout/SystemVoiceLabel
@onready var defer_btn: Button              = $ActionBar/ActionLayout/DeferButton
@onready var reject_btn: Button             = $ActionBar/ActionLayout/RejectButton
@onready var approve_btn: Button            = $ActionBar/ActionLayout/ApproveButton
@onready var crt_overlay: ColorRect         = $CRTOverlay
@onready var geometry_bg: ColorRect         = $GeometryBackground

# ── State ─────────────────────────────────────────────────────────────────────
var _case_data: Dictionary = {}
var _form_fields: Array = []       # Array of FormField instances
var _accumulated_effects: Dictionary = {}
var _accumulated_ripples: Array = []
var _form_field_scene: PackedScene = null

func _ready() -> void:
	_form_field_scene = load(FORM_FIELD_SCENE)

	# Apply shaders
	var crt_mat := ShaderMaterial.new()
	crt_mat.shader = load("res://shaders/crt.gdshader")
	if crt_mat.shader:
		crt_overlay.material = crt_mat

	var geo_mat := ShaderMaterial.new()
	geo_mat.shader = load("res://shaders/sacred_geometry.gdshader")
	if geo_mat.shader:
		geometry_bg.material = geo_mat

	approve_btn.pressed.connect(_on_approve)
	reject_btn.pressed.connect(_on_reject)
	defer_btn.pressed.connect(_on_defer)
	ContinuityState.state_changed.connect(_on_state_changed)

	_load_case()

func _load_case() -> void:
	var case_id: String = ContinuityState.active_case_id
	if case_id == "":
		push_error("FormScreen: No active_case_id set in ContinuityState.")
		_return_to_terminal()
		return

	_case_data = CaseLoader.get_case_by_id(case_id)
	if _case_data.is_empty():
		push_error("FormScreen: Case '%s' not found." % case_id)
		_return_to_terminal()
		return

	_render_case()

func _render_case() -> void:
	# Top bar
	employee_id_label.text = "PROCESSOR  ████████-Θ-%d" % ContinuityState.clearance_level
	clearance_label.text   = "CLEARANCE Θ-%d"           % ContinuityState.clearance_level
	dissolution_bar.value  = ContinuityState.dissolution_index

	# Worker unit info
	var wu: Dictionary = _case_data.get("worker_unit", {})
	worker_info_label.bbcode_enabled = true
	worker_info_label.text = (
		"[b]Worker-Unit: %s[/b]\n[i]%s[/i]\n%s, %s\n\n[b]Issue:[/b]\n%s" % [
			wu.get("id", "████████"),
			wu.get("name", "REDACTED"),
			wu.get("occupation", ""),
			str(wu.get("age", "")),
			_case_data.get("issue", ""),
		]
	)
	worker_portrait.setup(_case_data.get("worker_unit", {}), _case_data.get("form_type", ""))

	# Form header
	form_type_label.text  = "FORM %s" % _case_data.get("form_type", "")
	form_title_label.text = _case_data.get("form_title", _case_data.get("title", ""))
	issue_label.bbcode_enabled = true
	issue_label.text = _case_data.get("issue", "")

	# System note
	var note: String = _case_data.get("system_note", "")
	system_note_label.bbcode_enabled = true
	system_note_label.text = '[i][color=#FFB000]System Note: "%s"[/color][/i]' % note if note != "" else ""

	# Build form fields
	_build_fields()

	# System voice intro
	system_voice_label.bbcode_enabled = true
	system_voice_label.text = "[color=#F5EDE0][i]Take your time. The correct classification will feel like remembering something you already knew.[/i][/color]"

	# Initial button states
	_update_approve_state()

func _build_fields() -> void:
	for child in fields_container.get_children():
		child.queue_free()
	_form_fields.clear()

	if _form_field_scene == null:
		return

	var sections: Array = _case_data.get("sections", [])
	for section: Dictionary in sections:
		# Section title
		var sec_lbl := Label.new()
		sec_lbl.text = section.get("title", "")
		sec_lbl.add_theme_color_override("font_color", Color(1.0, 0.69, 0.0, 1.0))  # Amber
		fields_container.add_child(sec_lbl)

		var sep := HSeparator.new()
		fields_container.add_child(sep)

		# Fields in this section
		for field_data: Dictionary in section.get("fields", []):
			var ff = _form_field_scene.instantiate()
			ff.setup(field_data)
			ff.field_changed.connect(_on_field_changed)
			fields_container.add_child(ff)
			_form_fields.append(ff)

func _on_field_changed(field_id: String, value: Variant, effects: Dictionary, ripples: Array) -> void:
	# Accumulate effects for live preview
	for key in effects:
		if key not in _accumulated_effects:
			_accumulated_effects[key] = 0.0
		_accumulated_effects[key] = float(effects[key])
	for ripple in ripples:
		if ripple not in _accumulated_ripples:
			_accumulated_ripples.append(ripple)

	# Update live preview panel
	_update_preview(effects)
	_update_approve_state()

	# Update geometry harmony
	_update_geometry_harmony()

func _update_preview(latest_effects: Dictionary) -> void:
	for child in preview_container.get_children():
		child.queue_free()

	for key in _accumulated_effects:
		var delta: float = float(_accumulated_effects[key])
		if absf(delta) < 0.01:
			continue
		var lbl := Label.new()
		var sign: String = "+" if delta >= 0.0 else ""
		var color: String = "#00B8B0" if delta >= 0.0 else "#5C0010"
		lbl.add_theme_color_override("font_color", Color.html(color))
		lbl.text = "%s: %s%.1f" % [key.replace("_", " ").capitalize(), sign, delta]
		preview_container.add_child(lbl)

func _update_approve_state() -> void:
	var all_satisfied: bool = true
	for ff in _form_fields:
		if not ff.is_satisfied():
			all_satisfied = false
			break
	approve_btn.disabled = not all_satisfied

func _update_geometry_harmony() -> void:
	# Positive total effects = harmony; negative = conflict
	var total: float = 0.0
	for key in _accumulated_effects:
		total += float(_accumulated_effects[key])
	var harmony: float = clampf(total / 20.0, -1.0, 1.0)

	if geometry_bg and geometry_bg.material is ShaderMaterial:
		geometry_bg.material.set_shader_parameter("harmony_factor", harmony)

func _on_approve() -> void:
	_submit_form(true)

func _on_reject() -> void:
	# Rejecting a form inverts certain effects slightly
	_submit_form(false)

func _on_defer() -> void:
	# Defer: no effects applied, case stays in queue
	system_voice_label.text = "[color=#F5EDE0][i]Your hesitation has been noted and gently archived. Would you like assistance reframing it as wisdom?[/i][/color]"
	_return_to_terminal()

func _submit_form(approved: bool) -> void:
	# Apply all accumulated effects from field choices
	var all_effects: Dictionary = {}
	var all_ripples: Array = []

	for ff in _form_fields:
		var effects: Dictionary = ff.get_selected_effects()
		var ripples: Array      = ff.get_selected_ripples()
		for key in effects:
			if key not in all_effects:
				all_effects[key] = 0.0
			all_effects[key] = float(all_effects[key]) + float(effects[key])
		all_ripples.append_array(ripples)

	# Rejection modifier: halve positive efficiency gains, double dissolution
	if not approved:
		if "efficiency_score" in all_effects:
			all_effects["efficiency_score"] *= 0.5
		if "dissolution_index" in all_effects:
			all_effects["dissolution_index"] *= 2.0

	# Apply to state
	ContinuityState.apply_effects(all_effects)

	# Queue ripples
	for ripple in all_ripples:
		ContinuityState.queue_ripple(ripple)

	# Set completion flag
	var completion_flag: String = _case_data.get("completion_flag", "")
	if completion_flag != "":
		ContinuityState.set_flag(completion_flag)

	# Complete the case
	ContinuityState.complete_case(_case_data.get("id", ""))

	# Visual feedback
	_flash_submit_feedback(approved)

func _flash_submit_feedback(approved: bool) -> void:
	var color: Color = Color(1.0, 0.69, 0.0, 0.3) if approved else Color(0.36, 0.0, 0.063, 0.3)
	var flash := ColorRect.new()
	flash.color = color
	flash.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	add_child(flash)
	var tween := create_tween()
	tween.tween_property(flash, "modulate:a", 0.0, 0.6)
	tween.tween_callback(func() -> void:
		flash.queue_free()
		_return_to_terminal()
	)

func _on_state_changed(key: String, _value: Variant) -> void:
	if key == "dissolution_index":
		dissolution_bar.value = ContinuityState.dissolution_index

func _return_to_terminal() -> void:
	get_tree().change_scene_to_file(TERMINAL_SCENE)
