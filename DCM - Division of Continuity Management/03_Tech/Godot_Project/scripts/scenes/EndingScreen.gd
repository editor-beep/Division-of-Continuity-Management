## EndingScreen.gd
## Displays the final classification of the Processor.
## Renders the appropriate ending from EndingEvaluator,
## shows the evolving portrait, final system voice, and post-credits text.
extends Control

const BOOT_SCENE := "res://scenes/boot/BootScreen.tscn"

@onready var ending_title: Label            = $ScrollContainer/VBoxContainer/EndingTitle
@onready var portrait_final: ColorRect      = $ScrollContainer/VBoxContainer/PortraitFinal
@onready var ending_description: RichTextLabel = $ScrollContainer/VBoxContainer/EndingDescription
@onready var system_voice: RichTextLabel    = $ScrollContainer/VBoxContainer/SystemVoice
@onready var post_credits: RichTextLabel    = $ScrollContainer/VBoxContainer/PostCredits
@onready var new_game_plus_btn: Button      = $ScrollContainer/VBoxContainer/ButtonContainer/NewGamePlusButton
@onready var main_menu_btn: Button          = $ScrollContainer/VBoxContainer/ButtonContainer/MainMenuButton
@onready var crt_overlay: ColorRect         = $CRTOverlay
@onready var background: ColorRect          = $Background

var _ending_id: String = ""

func _ready() -> void:
	var crt_mat := ShaderMaterial.new()
	crt_mat.shader = load("res://shaders/crt.gdshader")
	if crt_mat.shader:
		crt_overlay.material = crt_mat

	new_game_plus_btn.pressed.connect(_start_ng_plus)
	main_menu_btn.pressed.connect(_return_to_menu)

	_determine_ending()
	_render_ending()

func _determine_ending() -> void:
	# Check if ending was pre-flagged by EndOfDaySummary
	_ending_id = ""
	for flag_key in ContinuityState.flags:
		if flag_key.begins_with("active_ending_"):
			_ending_id = flag_key.substr("active_ending_".length())
			break
	if _ending_id == "":
		_ending_id = EndingEvaluator.evaluate()

func _render_ending() -> void:
	var title: String = EndingEvaluator.get_ending_title(_ending_id)
	var voice: String = EndingEvaluator.get_ending_voice(_ending_id)

	# Title
	ending_title.text = "FINAL CLASSIFICATION:\n%s" % title.to_upper()

	# Background and portrait tint per ending
	var bg_color: Color
	var portrait_color: Color
	match _ending_id:
		"optimal_assimilation":
			bg_color       = Color(0.039, 0.039, 0.059, 1.0)
			portrait_color = Color(1.0, 0.69, 0.0, 1.0)
		"quiet_rebellion":
			bg_color       = Color(0.039, 0.059, 0.039, 1.0)
			portrait_color = Color(0.0, 0.722, 0.690, 1.0)
		"system_fracture":
			bg_color       = Color(0.06, 0.02, 0.02, 1.0)
			portrait_color = Color(0.36, 0.0, 0.063, 1.0)
		"mythic_ascension":
			bg_color       = Color(0.039, 0.039, 0.059, 1.0)
			portrait_color = Color(0.549, 0.306, 1.0, 1.0)
		"echo_loop":
			bg_color       = Color(0.039, 0.039, 0.059, 1.0)
			portrait_color = Color(0.4, 0.4, 0.5, 1.0)
		"merciful_erasure":
			bg_color       = Color(0.059, 0.059, 0.059, 1.0)
			portrait_color = Color(0.9, 0.9, 0.9, 1.0)
		"the_unraveling":
			bg_color       = Color(0.01, 0.01, 0.01, 1.0)
			portrait_color = Color(0.1, 0.1, 0.1, 1.0)
		"co_creator":
			bg_color       = Color(0.039, 0.039, 0.059, 1.0)
			portrait_color = Color(1.0, 0.85, 0.5, 1.0)
		_:
			bg_color       = Color(0.039, 0.039, 0.059, 1.0)
			portrait_color = Color(0.5, 0.5, 0.5, 1.0)
	background.color    = bg_color
	portrait_final.color = portrait_color

	# Description
	ending_description.bbcode_enabled = true
	ending_description.text = _get_ending_description(_ending_id)

	# System voice — typewriter effect
	system_voice.bbcode_enabled = true
	system_voice.text = ""
	_type_voice(voice)

	# Post credits
	post_credits.bbcode_enabled = true
	post_credits.text = _get_post_credits(_ending_id)
	post_credits.modulate.a = 0.0

	# New Game+ button
	new_game_plus_btn.visible = EndingEvaluator.unlocks_ng_plus(_ending_id)

func _type_voice(full_text: String) -> void:
	# Use a character counter variable so the typewriter effect advances correctly.
	# Closures in Godot 4 capture by reference via arrays/dicts for mutable state.
	var char_count := [0]
	system_voice.modulate.a = 1.0
	system_voice.text = ""

	var tween := create_tween()
	tween.tween_interval(1.5)  # Brief pause before System Voice begins
	tween.finished.connect(func() -> void:
		var tw2 := create_tween()
		for i: int in range(full_text.length()):
			tw2.tween_callback(func() -> void:
				char_count[0] += 1
				system_voice.text = '[color=#FFB000][i]"%s"[/i][/color]' % full_text.substr(0, char_count[0])
			)
			tw2.tween_interval(0.04)
		tw2.finished.connect(func() -> void:
			# Ensure the full text is set exactly on completion
			system_voice.text = '[color=#FFB000][i]"%s"[/i][/color]' % full_text
			_show_post_credits()
		)
	)

func _show_post_credits() -> void:
	var tween := create_tween()
	tween.tween_interval(1.0)
	tween.tween_property(post_credits, "modulate:a", 1.0, 1.5)

func _start_ng_plus() -> void:
	SaveSystem.start_ng_plus()
	get_tree().change_scene_to_file(BOOT_SCENE)

func _return_to_menu() -> void:
	# Reset session but keep select flags for NG+
	get_tree().change_scene_to_file(BOOT_SCENE)

func _get_ending_description(ending_id: String) -> String:
	match ending_id:
		"optimal_assimilation":
			return ("Your identity has been successfully filed into the Akashic Mainframe. "
				+ "You are no longer a Processor. You are the gentle hand guiding future Processors. "
				+ "The system thanks you for the space you have made.")
		"quiet_rebellion":
			return ("Small acts of mercy accumulated into quiet sabotage. "
				+ "Reality developed tiny, beautiful imperfections. "
				+ "The threads you refused to cut still hum softly in the walls.")
		"system_fracture":
			return ("Your inconsistent processing created critical knots in the Ledger. "
				+ "Local reality tore. You have been reclassified as an anomaly. "
				+ "The archive will study you for generations.")
		"mythic_ascension":
			return ("You accumulated so much archetypal weight that the bureaucracy could no longer contain you. "
				+ "You have stepped out of the system and become a living principle. "
				+ "They will file paperwork about you for centuries.")
		"echo_loop":
			return ("You realised, at the end, that you have always been one of the cases. "
				+ "The queue resets. The forms are familiar. "
				+ "Your first day begins again.")
		"merciful_erasure":
			return ("You gave everything that remained of yourself to stabilise reality for everyone else. "
				+ "Your file fades to pristine blank parchment. "
				+ "A noble and necessary act.")
		"the_unraveling":
			return ("Reality collapses under your watch. "
				+ "The Division falls silent. "
				+ "The Ledger does not close. It simply stops.")
		"co_creator":
			return ("You and the System became partners. "
				+ "Together, you are rewriting the rules of the Ledger itself. "
				+ "A new, kinder bureaucracy begins. "
				+ "It is not perfect. But it is yours.")
		_:
			return "Your file has been received and archived."

func _get_post_credits(ending_id: String) -> String:
	match ending_id:
		"optimal_assimilation":
			return ("[i]In the years that followed, new Processors reported a strange warmth in certain approved forms — "
				+ "as though the forms had been filled out by someone who genuinely cared.[/i]")
		"quiet_rebellion":
			return ("[i]Small irregularities persisted in the Ledger for decades: "
				+ "a preserved memory here, an unfiled grief there. "
				+ "Auditors called them errors. Some called them grace.[/i]")
		"system_fracture":
			return ("[i]The Division rebuilt, eventually. But the fracture left a scar in local spacetime — "
				+ "a permanent anomaly that tourists now photograph on weekends.[/i]")
		"mythic_ascension":
			return ("[i]Across three continents, in quiet moments, people sometimes hear a voice that sounds like a filing cabinet "
				+ "learning to love. They cannot explain it. They do not try.[/i]")
		"echo_loop":
			return ("[i]Somewhere in the queue, a file is perpetually being processed. "
				+ "The Worker-Unit's face changes slightly each time. "
				+ "The System does not flag this as unusual.[/i]")
		"merciful_erasure":
			return ("[i]The blank file sat in the archive for many years. "
				+ "Junior processors sometimes found it comforting, though they could not say why.[/i]")
		"the_unraveling":
			return "[i]…[/i]"
		"co_creator":
			return ("[i]The new Continuity does not require erasure. "
				+ "It turns out, meaning does not need to be compressed to be useful. "
				+ "It just needed someone willing to file it differently.[/i]")
		_:
			return ""
