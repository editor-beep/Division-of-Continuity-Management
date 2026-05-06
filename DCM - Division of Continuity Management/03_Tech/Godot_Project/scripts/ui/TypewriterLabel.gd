## TypewriterLabel.gd
## Displays text one character at a time, with optional sound and pause support.
## Attach to a RichTextLabel node.
extends RichTextLabel

## Seconds between each character reveal.
@export var char_delay: float = 0.04
## Pause duration inserted when a punctuation character is encountered.
@export var punctuation_pause: float = 0.3
## Play a subtle tick sound on each character if an AudioStreamPlayer is assigned.
@export var tick_player: NodePath = NodePath("")

signal typing_finished
signal character_typed(char_index: int)

var _full_text: String = ""
var _current_index: int = 0
var _typing: bool = false
var _timer: float = 0.0
var _tick_node: AudioStreamPlayer = null

func _ready() -> void:
	if tick_player != NodePath(""):
		_tick_node = get_node_or_null(tick_player)
	bbcode_enabled = true
	text = ""

func _process(delta: float) -> void:
	if not _typing:
		return
	_timer -= delta
	if _timer <= 0.0:
		_reveal_next()

## Begin typing out the given string. Clears existing text first.
func type_text(new_text: String) -> void:
	_full_text = new_text
	_current_index = 0
	_typing = true
	_timer = 0.0
	text = ""

## Instantly reveal all remaining text and finish.
func skip_to_end() -> void:
	if not _typing:
		return
	text = _full_text
	_current_index = _full_text.length()
	_typing = false
	typing_finished.emit()

## Return true if the typewriter is still revealing characters.
func is_typing() -> bool:
	return _typing

func _reveal_next() -> void:
	if _current_index >= _full_text.length():
		_typing = false
		typing_finished.emit()
		return

	var ch: String = _full_text[_current_index]
	text += ch
	_current_index += 1
	character_typed.emit(_current_index)

	if _tick_node:
		_tick_node.play()

	# Pause longer after sentence-ending punctuation
	if ch in [".", "!", "?", "…"]:
		_timer = punctuation_pause
	elif ch in [",", ";", ":"]:
		_timer = char_delay * 3.0
	else:
		_timer = char_delay
