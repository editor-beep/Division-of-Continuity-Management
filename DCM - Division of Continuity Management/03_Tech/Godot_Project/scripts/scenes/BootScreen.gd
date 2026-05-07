## BootScreen.gd
## Division login/boot sequence. Assembles the Division seal, types boot text,
## then waits for player input before transitioning to the Main Terminal.
extends Control

const MAIN_TERMINAL_SCENE := "res://scenes/terminal/MainTerminal.tscn"

const BOOT_LINES := [
	"DIVISION OF CONTINUITY MANAGEMENT",
	"Akashic Mainframe Interface — Build 17.C.4",
	"",
	"Initialising Ontological Filing System…",
	"Loading Continuity Ledger… [INTACT]",
	"Verifying Processor Identity…",
	"Narrative Stability: NOMINAL",
	"",
	"Good morning, beloved Processor.",
	"Your Continuity File remains stable.",
	"Today's queue has been gently calibrated.",
	"",
	"The threads you touch today will echo.",
	"",
	"[Press ENTER or click to begin your shift]",
]

@onready var background: ColorRect        = $Background
@onready var seal_container: Control      = $SealContainer
@onready var seal_rect: ColorRect         = $SealContainer/SealRect
@onready var boot_text: RichTextLabel     = $ContentContainer/BootText
@onready var prompt_label: Label          = get_node_or_null("ContentContainer/PromptLabel") as Label
@onready var crt_overlay: ColorRect       = get_node_or_null("CRTOverlay") as ColorRect
@onready var geometry_bg: ColorRect       = $GeometryBackground

var _current_line: int = 0
var _typing_timer: float = 0.0
var _current_char: int   = 0
var _done: bool = false
var _ready_for_input: bool = false
var _boot_started: bool = false
var _ready_started_ms: int = 0

# Typewriter state
var _full_current_line: String = ""

func _ready() -> void:
	background.color = Color(0.039, 0.039, 0.059, 1.0)
	modulate = Color(1, 1, 1, 1)
	_ready_started_ms = Time.get_ticks_msec()
	if is_instance_valid(prompt_label):
		prompt_label.visible = false
	boot_text.bbcode_enabled = true
	boot_text.text = ""
	boot_text.modulate = Color(0.92, 0.95, 1.0, 1.0)
	if is_instance_valid(prompt_label):
		prompt_label.modulate = Color(1.0, 0.84, 0.35, 1.0)
	set_process(true)
	_animate_seal_in()

	# Apply CRT shader if available
	var crt_shader = load("res://shaders/crt.gdshader")
	if crt_shader and is_instance_valid(crt_overlay):
		var mat := ShaderMaterial.new()
		mat.shader = crt_shader
		crt_overlay.material = mat

	# Sacred geometry background
	var geo_shader = load("res://shaders/sacred_geometry.gdshader")
	if geo_shader:
		var mat := ShaderMaterial.new()
		mat.shader = geo_shader
		geometry_bg.material = mat

func _process(delta: float) -> void:
	# Failsafe: if a tween or callback fails, start the boot text directly.
	if not _boot_started and Time.get_ticks_msec() - _ready_started_ms > 2500:
		_start_boot_text()
	if _done:
		return
	_typing_timer -= delta
	if _typing_timer <= 0.0:
		_type_next_char(delta)

func _unhandled_input(event: InputEvent) -> void:
	if not _ready_for_input:
		return
	if event.is_action_pressed("ui_confirm") or event is InputEventMouseButton and event.pressed:
		_transition_to_terminal()

func _animate_seal_in() -> void:
	seal_rect.modulate.a = 0.0
	var tween := create_tween()
	tween.tween_property(seal_rect, "modulate:a", 1.0, 2.0).set_ease(Tween.EASE_IN)
	tween.finished.connect(_start_boot_text)

func _start_boot_text() -> void:
	_boot_started = true
	_current_line = 0
	_typing_timer = 0.3
	_advance_to_next_line()

func _advance_to_next_line() -> void:
	if _current_line >= BOOT_LINES.size():
		_done = true
		_ready_for_input = true
		if is_instance_valid(prompt_label):
			prompt_label.visible = true
			_pulse_prompt()
		return
	_full_current_line = BOOT_LINES[_current_line]
	_current_char = 0
	_typing_timer = 0.0

func _type_next_char(_delta: float) -> void:
	if _current_char < _full_current_line.length():
		var ch: String = _full_current_line[_current_char]
		boot_text.text += ch
		_current_char += 1
		_typing_timer = 0.06 if ch not in [".", ",", "…"] else 0.25
	else:
		# Line done — move to next
		boot_text.text += "\n"
		_current_line += 1
		_typing_timer = 0.15
		_advance_to_next_line()

func _pulse_prompt() -> void:
	var tween := create_tween().set_loops()
	tween.tween_property(prompt_label, "modulate:a", 0.2, 0.8)
	tween.tween_property(prompt_label, "modulate:a", 1.0, 0.8)

func _transition_to_terminal() -> void:
	_ready_for_input = false
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.8)
	tween.finished.connect(func() -> void:
		# Load existing save if present
		if SaveSystem.has_save():
			SaveSystem.load_game()
		var scene_error := get_tree().change_scene_to_file(MAIN_TERMINAL_SCENE)
		if scene_error != OK:
			push_error("BootScreen: Failed to load main scene (%s), error code: %d" % [MAIN_TERMINAL_SCENE, scene_error])
	)
