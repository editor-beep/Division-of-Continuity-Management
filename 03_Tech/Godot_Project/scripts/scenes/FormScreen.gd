## FormScreen.gd
## The heart of the game. Renders the current case as an interactive form.
## Dynamically builds form fields from case JSON data.
## Applies effects to ContinuityState on submission.
##
## New capabilities:
##   - Thread View: return cases show a prior-choices timeline above the form.
##   - Choice Recording: field selections recorded per worker-unit for thread history.
##   - Contradiction Voice: case_016 (Θ-PIR) triggers escalating System voice.
extends Control

const TERMINAL_SCENE   := "res://scenes/terminal/MainTerminal.tscn"
const FORM_FIELD_SCENE := "res://scenes/components/FormField.tscn"

# The contradiction audit case — gets special voice treatment
const CONTRADICTION_CASE_ID := "case_016"

# ── Node References ───────────────────────────────────────────────────────────
@onready var employee_id_label: Label       = $TopBar/TopBarLayout/EmployeeIdLabel
@onready var clearance_label: Label         = $TopBar/TopBarLayout/ClearanceLabel
@onready var dissolution_bar: ProgressBar   = $TopBar/TopBarLayout/DissolutionBar
@onready var worker_portrait: ColorRect     = $FormBody/LeftPanel/LeftVBox/PortraitContainer
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
var _form_fields: Array = []
var _accumulated_effects: Dictionary = {}
var _accumulated_ripples: Array = []
var _form_field_scene: PackedScene = null

# Per-field choice tracking for Thread View history recording
var _field_choices: Dictionary = {}

# Contradiction voice escalation state
var _contradiction_voice_stage: int = 0

func _ready() -> void:
	_form_field_scene = load(FORM_FIELD_SCENE)

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
	employee_id_label.text = "PROCESSOR  ████████-Θ-%d" % ContinuityState.clearance_level
	clearance_label.text   = "CLEARANCE Θ-%d"           % ContinuityState.clearance_level
	dissolution_bar.value  = ContinuityState.dissolution_index

	var wu: Dictionary = _case_data.get("worker_unit", {})
	worker_info_label.bbcode_enabled = true
	worker_info_label.text = (
		"[b]Worker-Unit: %s[/b]\n[i]%s[/i]\n%s, %s\n\n[b]Issue:[/b]\n%s" % [
			wu.get("id", "████████"),
			wu.get("name", "REDACTED"),
			wu.get("occupation", ""),
			str(wu.get("age", "")),
			_process_template(_case_data.get("issue", "")),
		]
	)
	worker_portrait.color = _portrait_color_for_case()

	form_type_label.text  = "FORM %s" % _case_data.get("form_type", "")
	form_title_label.text = _case_data.get("form_title", _case_data.get("title", ""))
	issue_label.bbcode_enabled = true
	issue_label.text = _process_template(_case_data.get("issue", ""))

	var note: String = _process_template(_case_data.get("system_note", ""))
	system_note_label.bbcode_enabled = true
	system_note_label.text = '[i][color=#FFB000]System Note: "%s"[/color][/i]' % note if note != "" else ""

	_build_fields()

	# Contradiction case gets a special opening voice
	if _case_data.get("id", "") == CONTRADICTION_CASE_ID:
		_set_contradiction_voice(0)
	else:
		system_voice_label.bbcode_enabled = true
		system_voice_label.text = "[color=#F5EDE0][i]Take your time. The correct classification will feel like remembering something you already knew.[/i][/color]"

	_update_approve_state()

func _build_fields() -> void:
	for child in fields_container.get_children():
		child.queue_free()
	_form_fields.clear()
	_field_choices.clear()

	if _form_field_scene == null:
		return

	# Thread View: show prior decisions for return cases
	if _case_data.get("is_return_case", false):
		_build_thread_view()

	var sections: Array = _case_data.get("sections", [])
	for section: Dictionary in sections:
		var sec_lbl := Label.new()
		sec_lbl.text = section.get("title", "")
		sec_lbl.add_theme_color_override("font_color", Color(1.0, 0.69, 0.0, 1.0))
		fields_container.add_child(sec_lbl)

		var sep := HSeparator.new()
		fields_container.add_child(sep)

		for field_data: Dictionary in section.get("fields", []):
			var ff = _form_field_scene.instantiate()
			ff.setup(field_data)
			ff.field_changed.connect(_on_field_changed)
			fields_container.add_child(ff)
			_form_fields.append(ff)

# ── Thread View ───────────────────────────────────────────────────────────────

func _build_thread_view() -> void:
	var char_id: String = _case_data.get("worker_unit", {}).get("id", "")
	if char_id == "" or char_id.begins_with("███"):
		return

	var history: Array = ContinuityState.get_character_history(char_id)
	if history.is_empty():
		return

	var char_name: String = _case_data.get("worker_unit", {}).get("name", "REDACTED")

	var header := RichTextLabel.new()
	header.bbcode_enabled = true
	header.fit_content = true
	header.text = "[color=#007DB8]── THREAD RECORD: %s / %s ──[/color]" % [char_id, char_name]
	fields_container.add_child(header)

	for entry: Dictionary in history:
		var prior: Dictionary = CaseLoader.get_case_by_id(entry.get("case_id", ""))
		if prior.is_empty():
			continue

		var entry_rtl := RichTextLabel.new()
		entry_rtl.bbcode_enabled = true
		entry_rtl.fit_content = true

		var text: String = "[color=#666666][Day %d] Form %s — %s[/color]\n" % [
			entry.get("day", 0),
			prior.get("form_type", ""),
			prior.get("title", ""),
		]
		var choices: Dictionary = entry.get("choices", {})
		for field_id: String in choices:
			var opt_label: String = _find_option_label(prior, field_id, choices[field_id])
			if opt_label != "":
				text += "[color=#C8B99A]  → %s[/color]\n" % opt_label

		entry_rtl.text = text
		fields_container.add_child(entry_rtl)

	var thread_sep := HSeparator.new()
	thread_sep.add_theme_color_override("color", Color(0.0, 0.478, 0.722, 0.5))
	fields_container.add_child(thread_sep)

func _find_option_label(case_data: Dictionary, field_id: String, option_id: String) -> String:
	for section: Dictionary in case_data.get("sections", []):
		for field: Dictionary in section.get("fields", []):
			if field.get("id", "") == field_id:
				for opt: Dictionary in field.get("options", []):
					if opt.get("id", "") == option_id:
						return opt.get("label", option_id)
	return ""

# ── Field Events ──────────────────────────────────────────────────────────────

func _on_field_changed(field_id: String, value: Variant, effects: Dictionary, ripples: Array) -> void:
	# Track choice selections (string values are option IDs)
	if value is String and value != "":
		_field_choices[field_id] = value

	for key in effects:
		if key not in _accumulated_effects:
			_accumulated_effects[key] = 0.0
		_accumulated_effects[key] = float(effects[key])
	for ripple in ripples:
		if ripple not in _accumulated_ripples:
			_accumulated_ripples.append(ripple)

	_update_preview(effects)
	_update_approve_state()
	_update_geometry_harmony()

	# Contradiction case: update voice based on what the player is selecting
	if _case_data.get("id", "") == CONTRADICTION_CASE_ID:
		_update_contradiction_voice(field_id, value)

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
	var total: float = 0.0
	for key in _accumulated_effects:
		total += float(_accumulated_effects[key])
	var harmony: float = clampf(total / 20.0, -1.0, 1.0)
	if geometry_bg and geometry_bg.material is ShaderMaterial:
		geometry_bg.material.set_shader_parameter("harmony_factor", harmony)

# ── Contradiction Voice ───────────────────────────────────────────────────────

const CONTRADICTION_VOICES := [
	"[color=#F5EDE0][i]An inconsistency has been detected in your Continuity File. Please select the appropriate resolution. Take your time.[/i][/color]",
	"[color=#FFB000][i]We notice that several options are… unavailable to you. This is a result of your previous decisions. Please select from what remains.[/i][/color]",
	"[color=#FF8800][i]The Division wishes to clarify: this is not a judgment. Your accumulated contradictions are simply crystallized here. Please proceed.[/i][/color]",
	"[color=#FF4400][i]Processor. We need you to select a resolution. The audit cannot be deferred. Please. The forms are waiting.[/i][/color]",
]

func _set_contradiction_voice(stage: int) -> void:
	_contradiction_voice_stage = clampi(stage, 0, CONTRADICTION_VOICES.size() - 1)
	system_voice_label.bbcode_enabled = true
	system_voice_label.text = CONTRADICTION_VOICES[_contradiction_voice_stage]

func _update_contradiction_voice(field_id: String, value: Variant) -> void:
	# Escalate voice when player selects the costly "error_correction" option
	if field_id == "contradiction_resolution":
		match str(value):
			"error_correction":
				_set_contradiction_voice(3)
			"approved_methodology":
				_set_contradiction_voice(1)
			_:
				_set_contradiction_voice(2)

# ── Form Submission ───────────────────────────────────────────────────────────

func _on_approve() -> void:
	_submit_form(true)

func _on_reject() -> void:
	_submit_form(false)

func _on_defer() -> void:
	system_voice_label.text = "[color=#F5EDE0][i]Your hesitation has been noted and gently archived. Would you like assistance reframing it as wisdom?[/i][/color]"
	_return_to_terminal()

func _submit_form(approved: bool) -> void:
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

	if not approved:
		if "efficiency_score" in all_effects:
			all_effects["efficiency_score"] *= 0.5
		if "dissolution_index" in all_effects:
			all_effects["dissolution_index"] *= 2.0

	ContinuityState.apply_effects(all_effects)

	for ripple in all_ripples:
		ContinuityState.queue_ripple(ripple)

	# Set flags declared by each selected option
	for ff in _form_fields:
		for flag: String in ff.get_selected_flags():
			ContinuityState.set_flag(flag)

	var completion_flag: String = _case_data.get("completion_flag", "")
	if completion_flag != "":
		ContinuityState.set_flag(completion_flag)

	# Record worker-unit choice history for future Thread Views
	var char_id: String = _case_data.get("worker_unit", {}).get("id", "")
	if char_id != "" and not char_id.begins_with("███") and not _field_choices.is_empty():
		ContinuityState.record_character_choice(char_id, _case_data.get("id", ""), _field_choices)

	ContinuityState.complete_case(_case_data.get("id", ""))

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

# ── Helpers ───────────────────────────────────────────────────────────────────

## Replace {stat_name} tokens with live values from ContinuityState.
func _process_template(text: String) -> String:
	if not "{" in text:
		return text
	var result: String = text
	for key: String in ContinuityState.STAT_RANGES:
		var val = ContinuityState.get(key)
		if val != null:
			result = result.replace("{%s}" % key, "%.1f" % float(val))
	result = result.replace("{clearance_level}",   str(ContinuityState.clearance_level))
	result = result.replace("{echo_interactions}",  str(ContinuityState.echo_interactions))
	result = result.replace("{unraveling_events}",  str(ContinuityState.unraveling_events))
	result = result.replace("{current_day}",        str(ContinuityState.current_day))
	return result

func _portrait_color_for_case() -> Color:
	var form_type: String = _case_data.get("form_type", "")
	match form_type:
		"Θ-SR1", "Θ-SR2", "Θ-SR3":
			return Color(0.549, 0.306, 1.0, 0.6)
		"Θ-PIR":
			return Color(0.8, 0.2, 0.2, 0.6)    # Red — contradiction audit
		"M-11", "M-11b":
			return Color(1.0, 0.69, 0.0, 0.5)
		"G-7":
			return Color(0.0, 0.722, 0.690, 0.5)
		_:
			return Color(0.3, 0.3, 0.35, 1.0)
