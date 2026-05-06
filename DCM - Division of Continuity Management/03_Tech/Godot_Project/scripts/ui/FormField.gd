## FormField.gd
## Dynamically renders a single case form field from a field data dictionary.
## Supports types: choice, slider, text, toggle.
## Emits field_changed when the player makes a selection.
## Attach to a VBoxContainer node named "FormField".
extends VBoxContainer

signal field_changed(field_id: String, value: Variant, effects: Dictionary, ripples: Array)

var field_data: Dictionary = {}
var _selected_option_id: String = ""
var _current_value: Variant = null

## Initialise this field from a field data dict (from case JSON).
func setup(data: Dictionary) -> void:
	field_data = data
	_build_ui()

func get_value() -> Variant:
	return _current_value

func get_selected_effects() -> Dictionary:
	if field_data.get("type", "") == "choice":
		for opt: Dictionary in field_data.get("options", []):
			if opt.get("id", "") == _selected_option_id:
				return opt.get("effects", {})
	return {}

func get_selected_ripples() -> Array:
	if field_data.get("type", "") == "choice":
		for opt: Dictionary in field_data.get("options", []):
			if opt.get("id", "") == _selected_option_id:
				return opt.get("ripples", [])
	return []

func is_satisfied() -> bool:
	if not field_data.get("required", false):
		return true
	match field_data.get("type", ""):
		"choice": return _selected_option_id != ""
		"slider": return true
		"text":   return str(_current_value).strip_edges() != ""
		"toggle": return true
		_:        return true

# ── UI Construction ───────────────────────────────────────────────────────────

func _build_ui() -> void:
	# Clear existing children
	for child in get_children():
		child.queue_free()

	var ftype: String = field_data.get("type", "choice")

	# Field label
	var lbl := Label.new()
	lbl.text = field_data.get("label", "")
	lbl.add_theme_color_override("font_color", Color(0.961, 0.929, 0.878, 1.0))  # Parchment
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	add_child(lbl)

	# Optional description / sublabel
	var desc: String = field_data.get("description", "")
	if desc != "":
		var sub := Label.new()
		sub.text = desc
		sub.add_theme_font_size_override("font_size", 11)
		sub.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1.0))
		sub.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		add_child(sub)

	match ftype:
		"choice": _build_choice()
		"slider": _build_slider()
		"text":   _build_text()
		"toggle": _build_toggle()

func _build_choice() -> void:
	var options: Array = field_data.get("options", [])
	var btn_group := ButtonGroup.new()
	for opt: Dictionary in options:
		var btn := Button.new()
		var main_label: String = opt.get("label", "")
		var sub_label: String  = opt.get("sublabel", "")
		btn.text = main_label + ("\n[%s]" % sub_label if sub_label != "" else "")
		btn.toggle_mode = true
		btn.button_group = btn_group
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART

		var opt_id: String = opt.get("id", "")
		btn.pressed.connect(_on_option_selected.bind(opt_id, opt))
		add_child(btn)

func _build_slider() -> void:
	var min_val: float = float(field_data.get("min", 0))
	var max_val: float = float(field_data.get("max", 100))
	var default_val: float = float(field_data.get("default", (min_val + max_val) * 0.5))

	var hbox := HBoxContainer.new()
	var slider := HSlider.new()
	slider.min_value = min_val
	slider.max_value = max_val
	slider.value     = default_val
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL

	var val_label := Label.new()
	val_label.text = "%.0f" % default_val
	val_label.custom_minimum_size = Vector2(40, 0)

	_current_value = default_val
	slider.value_changed.connect(func(v: float) -> void:
		_current_value = v
		val_label.text = "%.0f" % v
		var effects: Dictionary = _interpolate_slider_effects(v, min_val, max_val)
		field_changed.emit(field_data.get("id", ""), v, effects, [])
	)
	hbox.add_child(slider)
	hbox.add_child(val_label)
	add_child(hbox)

func _build_text() -> void:
	var edit := TextEdit.new()
	edit.placeholder_text = field_data.get("placeholder", "Enter re-narration…")
	edit.custom_minimum_size = Vector2(0, 60)
	_current_value = ""
	edit.text_changed.connect(func() -> void:
		_current_value = edit.text
		field_changed.emit(field_data.get("id", ""), edit.text, {}, [])
	)
	add_child(edit)

func _build_toggle() -> void:
	var check := CheckButton.new()
	check.text = field_data.get("toggle_label", "Approve")
	_current_value = false
	check.toggled.connect(func(pressed: bool) -> void:
		_current_value = pressed
		var effects: Dictionary = field_data.get("effects_on", {}) if pressed else field_data.get("effects_off", {})
		var ripples: Array = field_data.get("ripples_on", []) if pressed else []
		field_changed.emit(field_data.get("id", ""), pressed, effects, ripples)
	)
	add_child(check)

# ── Event Handlers ────────────────────────────────────────────────────────────

func _on_option_selected(option_id: String, opt_data: Dictionary) -> void:
	_selected_option_id = option_id
	_current_value = option_id
	field_changed.emit(field_data.get("id", ""), option_id,
		opt_data.get("effects", {}), opt_data.get("ripples", []))

# ── Helpers ───────────────────────────────────────────────────────────────────

func _interpolate_slider_effects(value: float, min_val: float, max_val: float) -> Dictionary:
	var at_min: Dictionary = field_data.get("effects_at_min", {})
	var at_max: Dictionary = field_data.get("effects_at_max", {})
	if at_min.is_empty() and at_max.is_empty():
		return {}
	var t: float = (value - min_val) / maxf(1.0, max_val - min_val)
	var result: Dictionary = {}
	for key in at_max:
		var min_eff: float = float(at_min.get(key, 0.0))
		var max_eff: float = float(at_max.get(key, 0.0))
		result[key] = lerpf(min_eff, max_eff, t)
	for key in at_min:
		if key not in result:
			result[key] = float(at_min.get(key, 0.0))
	return result
