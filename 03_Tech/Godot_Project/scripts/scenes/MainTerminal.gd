## MainTerminal.gd
## The primary hub — shows daily greeting, the case queue, live metrics.
## Player navigates to FormScreen per case, or opens their PlayerFile.
extends Control

const FORM_SCENE        := "res://scenes/form/FormScreen.tscn"
const PLAYER_FILE_SCENE := "res://scenes/player_file/PlayerFile.tscn"
const SUMMARY_SCENE     := "res://scenes/summary/EndOfDaySummary.tscn"

# ── Node References ───────────────────────────────────────────────────────────
@onready var employee_id_label: Label       = $TopBar/TopBarLayout/EmployeeIdLabel
@onready var clearance_label: Label         = $TopBar/TopBarLayout/ClearanceLabel
@onready var dissolution_bar: ProgressBar   = $TopBar/TopBarLayout/DissolutionBar
@onready var daily_greeting: RichTextLabel  = $MainBody/CenterPanel/CenterVBox/DailyGreeting
@onready var case_list_container: VBoxContainer = $MainBody/CenterPanel/CenterVBox/CaseListScroll/CaseListContainer
@onready var portrait_container: ColorRect  = $MainBody/LeftPanel/LeftVBox/PortraitContainer
@onready var case_info_label: RichTextLabel = $MainBody/LeftPanel/LeftVBox/CaseInfoLabel
@onready var metrics_container: VBoxContainer = $MainBody/RightPanel/RightVBox/MetricsContainer
@onready var open_file_btn: Button          = $BottomBar/BottomBarLayout/OpenFileButton
@onready var end_shift_btn: Button          = $BottomBar/BottomBarLayout/EndShiftButton
@onready var crt_overlay: ColorRect         = $CRTOverlay

var _cases: Array = []
var _stat_bar_scene: PackedScene = null

func _ready() -> void:
	_stat_bar_scene = load("res://scenes/components/StatBar.tscn")

	# Apply CRT shader
	var crt_mat := ShaderMaterial.new()
	crt_mat.shader = load("res://shaders/crt.gdshader")
	if crt_mat.shader:
		crt_overlay.material = crt_mat

	open_file_btn.pressed.connect(_open_player_file)
	end_shift_btn.pressed.connect(_end_shift)
	ContinuityState.state_changed.connect(_on_state_changed)

	_populate_ui()

func _populate_ui() -> void:
	var day: int = ContinuityState.current_day
	employee_id_label.text = "PROCESSOR  ████████-Θ-%d" % ContinuityState.clearance_level
	clearance_label.text   = "CLEARANCE Θ-%d" % ContinuityState.clearance_level
	dissolution_bar.value  = ContinuityState.dissolution_index

	# Daily greeting
	var greeting: String = CaseLoader.get_day_opening(day)
	if greeting == "":
		greeting = _fallback_greeting(day)
	daily_greeting.bbcode_enabled = true
	daily_greeting.text = "[color=#F5EDE0]%s[/color]" % greeting

	# Load cases for today
	_cases = CaseLoader.get_cases_for_day(day)
	_populate_case_list()

	# Populate stats sidebar
	_populate_metrics()

	# End-shift button locked until at least one case done
	end_shift_btn.disabled = (ContinuityState.daily_cases_processed == 0 and _cases.size() > 0)

func _populate_case_list() -> void:
	# Clear existing
	for child in case_list_container.get_children():
		child.queue_free()

	if _cases.is_empty():
		var lbl := Label.new()
		lbl.text = "No pending cases. The queue is clear."
		lbl.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6, 1.0))
		case_list_container.add_child(lbl)
		end_shift_btn.disabled = false
		return

	for case_data: Dictionary in _cases:
		var btn := _make_case_button(case_data)
		case_list_container.add_child(btn)

func _make_case_button(case_data: Dictionary) -> Button:
	var btn := Button.new()
	var title: String    = case_data.get("title", "Untitled Case")
	var form_type: String= case_data.get("form_type", "")
	var case_id: String  = case_data.get("id", "")
	var is_return: bool  = case_data.get("is_return_case", false)
	var prefix: String   = "[RETURN] " if is_return else ""

	btn.text = "%s%s  [Form %s]" % [prefix, title, form_type]
	btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
	btn.pressed.connect(_open_case.bind(case_id, case_data))

	# Style return cases differently
	if is_return:
		btn.add_theme_color_override("font_color", Color(0.549, 0.306, 1.0, 1.0))  # Purple

	return btn

func _populate_metrics() -> void:
	for child in metrics_container.get_children():
		child.queue_free()

	var stats_to_show := [
		["dissolution_index",   "Dissolution",      false],
		["efficiency_score",    "Efficiency",        false],
		["narrative_stability", "Narrative Stability",true],
		["reality_stability",   "Reality Stability", true],
		["mythic_residue",      "Mythic Residue",   false],
	]
	if _stat_bar_scene == null:
		return
	for entry: Array in stats_to_show:
		var bar_instance = _stat_bar_scene.instantiate()
		bar_instance.stat_key       = entry[0]
		bar_instance.display_label  = entry[1]
		bar_instance.invert_warning = entry[2]
		metrics_container.add_child(bar_instance)

func _open_case(case_id: String, case_data: Dictionary) -> void:
	ContinuityState.active_case_id = case_id
	# Update case info preview in left panel
	var wu: Dictionary = case_data.get("worker_unit", {})
	case_info_label.text = "[b]%s[/b]\n%s, %s\n\n[i]%s[/i]" % [
		wu.get("name", "REDACTED"),
		wu.get("occupation", ""),
		str(wu.get("age", "")),
		case_data.get("issue", ""),
	]
	# Fade to form screen
	var tween := create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.4)
	tween.finished.connect(func() -> void:
		get_tree().change_scene_to_file(FORM_SCENE)
	)

func _open_player_file() -> void:
	get_tree().change_scene_to_file(PLAYER_FILE_SCENE)

func _end_shift() -> void:
	if ContinuityState.daily_cases_processed == 0:
		return
	get_tree().change_scene_to_file(SUMMARY_SCENE)

func _on_state_changed(key: String, _value: Variant) -> void:
	match key:
		"dissolution_index":
			dissolution_bar.value = ContinuityState.dissolution_index
		"clearance_level":
			clearance_label.text = "CLEARANCE Θ-%d" % ContinuityState.clearance_level

func _fallback_greeting(day: int) -> String:
	return "Good morning, beloved Processor. Day %d shift commencing.\nYour queue awaits. Process with care. The threads you touch today will echo." % day
