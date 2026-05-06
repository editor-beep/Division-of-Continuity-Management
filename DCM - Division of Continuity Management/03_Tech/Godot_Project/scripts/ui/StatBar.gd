## StatBar.gd
## A labelled progress bar that binds to a ContinuityState stat.
## Used in the right-panel metrics display and the Player File screen.
extends HBoxContainer

## Name of the stat to observe in ContinuityState.
@export var stat_key: String = "dissolution_index"
## Display label override. If blank, stat_key is used.
@export var display_label: String = ""
## Colour of the bar fill. Can be driven by dissolution for dynamic tinting.
@export var bar_color: Color = Color(0.0, 0.722, 0.690, 1.0)  # Teal default
## If true, low values are considered "bad" (bar turns maroon when low).
@export var invert_warning: bool = false

@onready var label_node: Label = $StatLabel
@onready var bar_node: ProgressBar = $StatProgress
@onready var value_node: Label = $StatValue

func _ready() -> void:
	_refresh_display()
	ContinuityState.state_changed.connect(_on_state_changed)
	_apply_color()

func _on_state_changed(key: String, new_value: Variant) -> void:
	if key == stat_key:
		_refresh_display()

func _refresh_display() -> void:
	var raw_value: Variant = ContinuityState.get(stat_key)
	if raw_value == null:
		return
	var fval: float = float(raw_value)

	label_node.text = display_label if display_label != "" else stat_key.replace("_", " ").capitalize()
	bar_node.value = fval
	value_node.text = "%.1f" % fval

	# Dynamic color: dissolution bar pulses amber→maroon as it rises
	if stat_key == "dissolution_index":
		bar_color = Color(1.0, 0.69, 0.0, 1.0).lerp(Color(0.36, 0.0, 0.063, 1.0), fval / 100.0)
		_apply_color()
	elif invert_warning and fval < 30.0:
		bar_color = Color(0.36, 0.0, 0.063, 1.0)
		_apply_color()

func _apply_color() -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = bar_color
	if bar_node:
		bar_node.add_theme_stylebox_override("fill", style)
