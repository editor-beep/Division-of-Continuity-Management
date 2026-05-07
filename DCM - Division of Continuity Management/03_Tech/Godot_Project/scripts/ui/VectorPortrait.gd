## VectorPortrait.gd
## Procedural worker-unit portrait renderer.
## Draws a minimalist bureaucratic silhouette using canvas draw calls.
## Also supports loading an external image when portrait_path is set on the
## worker_unit dict in case JSON (e.g. "portrait_path": "res://portraits/e7742.png").
## Attach to a Control node sized to the desired portrait area.
class_name VectorPortrait
extends Control

var worker_data: Dictionary = {}
var form_type: String = ""

var _loaded_texture: Texture2D = null
var _is_setup: bool = false

# ── Public API ────────────────────────────────────────────────────────────────

## Configure the portrait from a worker_unit dict and optional form type string.
func setup(p_worker_data: Dictionary, p_form_type: String = "") -> void:
	worker_data    = p_worker_data
	form_type      = p_form_type
	_is_setup      = true
	_loaded_texture = null

	# Attempt to load a custom portrait image if the case JSON provides a path.
	var portrait_path: String = p_worker_data.get("portrait_path", "")
	if portrait_path != "" and ResourceLoader.exists(portrait_path):
		_loaded_texture = load(portrait_path) as Texture2D

	queue_redraw()

## Reset to the empty/idle state.
func clear() -> void:
	_is_setup       = false
	_loaded_texture = null
	worker_data     = {}
	form_type       = ""
	queue_redraw()

# ── Canvas Drawing ────────────────────────────────────────────────────────────

func _draw() -> void:
	var w: float = size.x
	var h: float = size.y
	if w < 4.0 or h < 4.0:
		return

	# Background
	draw_rect(Rect2(0.0, 0.0, w, h), Color(0.10, 0.09, 0.12))

	# Custom image: draw it and overlay classification marks.
	if _loaded_texture != null:
		draw_texture_rect(_loaded_texture, Rect2(0.0, 0.0, w, h), false)
		_draw_corner_marks(w, h)
		return

	# Empty / idle state: show a subtle placeholder circle.
	if not _is_setup:
		draw_circle(Vector2(w * 0.5, h * 0.5), minf(w, h) * 0.22, Color(0.18, 0.16, 0.20))
		draw_arc(Vector2(w * 0.5, h * 0.5), minf(w, h) * 0.22, 0.0, TAU, 48, Color(0.30, 0.28, 0.34), 1.5)
		return

	var accent: Color = _form_type_color()

	# ── Silhouette ────────────────────────────────────────────────────────────
	var cx: float       = w * 0.50
	var head_r: float   = minf(w, h) * 0.17
	var head_cy: float  = h * 0.28

	# Drop shadow for depth
	draw_circle(Vector2(cx, head_cy + 3.0), head_r + 2.5, Color(0.05, 0.04, 0.07))

	# Head
	draw_circle(Vector2(cx, head_cy), head_r, Color(0.72, 0.67, 0.61))

	# Neck
	var neck_w: float  = head_r * 0.40
	var neck_top: float = head_cy + head_r * 0.80
	draw_rect(Rect2(cx - neck_w, neck_top, neck_w * 2.0, head_r * 0.55), Color(0.63, 0.58, 0.53))

	# Shoulders / body (tapered quad)
	var sh_top: float = neck_top + head_r * 0.45
	var body_pts := PackedVector2Array([
		Vector2(cx - head_r * 0.55, sh_top),
		Vector2(cx + head_r * 0.55, sh_top),
		Vector2(cx + w * 0.44, h + 2.0),
		Vector2(cx - w * 0.44, h + 2.0),
	])
	draw_colored_polygon(body_pts, Color(0.48, 0.44, 0.40))

	# Shoulder highlight — subtle accent stripe
	draw_line(
		Vector2(cx - head_r * 0.50, sh_top),
		Vector2(cx + head_r * 0.50, sh_top),
		accent * Color(1.0, 1.0, 1.0, 0.22),
		1.5
	)

	# ── Bureaucratic data bars ─────────────────────────────────────────────────
	var bar_x: float = w * 0.07
	var bar_w: float = w * 0.86
	for i: int in 3:
		var bar_y: float = h * 0.62 + float(i) * h * 0.10
		draw_rect(Rect2(bar_x, bar_y, bar_w, 5.0), Color(0.22, 0.20, 0.25))
		# Accent fill — shrinks per row to suggest variable redaction
		var fill_w: float = bar_w * (0.65 - float(i) * 0.13)
		draw_rect(Rect2(bar_x, bar_y, fill_w, 2.0), accent * Color(1.0, 1.0, 1.0, 0.50))

	# ── Corner classification marks ────────────────────────────────────────────
	_draw_corner_marks(w, h)

# ── Helpers ───────────────────────────────────────────────────────────────────

func _draw_corner_marks(w: float, h: float) -> void:
	var accent: Color = form_type_color(form_type)
	var m: float = 4.0
	var s: float = 9.0
	# Top-left
	draw_rect(Rect2(m, m, s, 2.0),       accent * Color(1.0, 1.0, 1.0, 0.75))
	draw_rect(Rect2(m, m, 2.0, s),       accent * Color(1.0, 1.0, 1.0, 0.75))
	# Top-right
	draw_rect(Rect2(w - m - s, m, s, 2.0),  accent * Color(1.0, 1.0, 1.0, 0.75))
	draw_rect(Rect2(w - m - 2.0, m, 2.0, s), accent * Color(1.0, 1.0, 1.0, 0.75))

## Returns the canonical accent colour for a given form type string.
## Static so other scripts can use it without needing a VectorPortrait instance.
static func form_type_color(p_form_type: String) -> Color:
	match p_form_type:
		"Θ-SR1", "Θ-SR2", "Θ-SR3": return Color(0.549, 0.306, 1.0)    # Purple — self-referential
		"M-11",  "M-11b":           return Color(1.0,   0.69,  0.0)    # Amber  — mythic
		"G-7":                      return Color(0.0,   0.722, 0.690)  # Teal   — grief
		_:                          return Color(0.70,  0.70,  0.80)   # Neutral

func _form_type_color() -> Color:
	return form_type_color(form_type)
