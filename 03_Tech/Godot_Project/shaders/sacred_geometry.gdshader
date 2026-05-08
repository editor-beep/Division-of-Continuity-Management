// sacred_geometry.gdshader
// Godot 4 canvas_item shader for the living background geometry.
// Renders an animated Flower of Life pattern with mandala overlays.
// Responds to harmony_factor: positive = golden harmony, negative = red conflict.
// Intensity scales with dissolution parameter.
shader_type canvas_item;

uniform float time_scale: hint_range(0.01, 2.0) = 0.12;
uniform float base_opacity: hint_range(0.0, 1.0) = 0.07;
uniform vec4 geometry_color: source_color = vec4(1.0, 0.690, 0.0, 1.0);
/// -1.0 = maximum conflict (red), 0.0 = neutral, +1.0 = maximum harmony (bright gold)
uniform float harmony_factor: hint_range(-1.0, 1.0) = 0.0;
/// Driven by dissolution_index / 100. Increases size and complexity.
uniform float dissolution: hint_range(0.0, 1.0) = 0.0;

// Signed-distance circle ring (thin outline)
float sdf_circle_ring(vec2 uv, vec2 center, float radius, float thickness) {
	float d = abs(length(uv - center) - radius);
	return smoothstep(thickness, 0.0, d);
}

// Thin line between two points
float sdf_line(vec2 uv, vec2 a, vec2 b, float thickness) {
	vec2 ab = b - a;
	vec2 ap = uv - a;
	float t = clamp(dot(ap, ab) / dot(ab, ab), 0.0, 1.0);
	return smoothstep(thickness, 0.0, length(uv - (a + t * ab)));
}

void fragment() {
	vec2 uv = UV;
	float t = TIME * time_scale;
	float geo = 0.0;

	float base_r = 0.10 + dissolution * 0.06;
	float pulse = 1.0 + sin(t * 1.3) * 0.03;  // gentle breathing

	// Flower of Life: centre + 6 surrounding circles
	geo += sdf_circle_ring(uv, vec2(0.5), base_r * pulse, 0.004);
	for (int i = 0; i < 6; i++) {
		float angle = float(i) * PI / 3.0 + t * 0.05;
		vec2 center = vec2(0.5) + vec2(cos(angle), sin(angle)) * base_r;
		geo += sdf_circle_ring(uv, center, base_r * pulse, 0.004);
	}

	// Outer bounding circle
	float outer_r = base_r * 2.0 + dissolution * 0.08;
	geo += sdf_circle_ring(uv, vec2(0.5), outer_r * pulse, 0.003);

	// Inner hexagram (Star of David) lines
	for (int i = 0; i < 6; i++) {
		float angle_a = float(i) * PI / 3.0 + t * 0.08;
		float angle_b = angle_a + PI;
		vec2 a = vec2(0.5) + vec2(cos(angle_a), sin(angle_a)) * outer_r * 0.55;
		vec2 b = vec2(0.5) + vec2(cos(angle_b), sin(angle_b)) * outer_r * 0.55;
		geo += sdf_line(uv, a, b, 0.002);
	}

	// Rotating inner spokes (mandala rays)
	for (int i = 0; i < 12; i++) {
		float angle = float(i) * PI / 6.0 + t * 0.15;
		vec2 inner = vec2(0.5) + vec2(cos(angle), sin(angle)) * 0.04;
		vec2 outer_pt = vec2(0.5) + vec2(cos(angle), sin(angle)) * outer_r;
		geo += sdf_line(uv, inner, outer_pt, 0.0015) * 0.6;
	}

	// Second outer ring at high dissolution
	if (dissolution > 0.3) {
		float outer2_r = outer_r + dissolution * 0.12;
		geo += sdf_circle_ring(uv, vec2(0.5), outer2_r * pulse, 0.002) * dissolution;
	}

	// Colour response to harmony / conflict
	vec4 final_color;
	if (harmony_factor >= 0.0) {
		// Harmonious: warm gold → bright amber
		final_color = mix(geometry_color, vec4(1.0, 0.85, 0.2, 1.0), harmony_factor * 0.6);
	} else {
		// Conflicted: gold → blood maroon
		final_color = mix(geometry_color, vec4(0.36, 0.0, 0.063, 1.0), -harmony_factor);
	}

	// Pulsing opacity driven by dissolution
	float opacity = geo * base_opacity * (1.0 + dissolution * 0.8);
	// Chaos overlay at high dissolution: fragments of geometry bleed outward
	if (dissolution > 0.6) {
		float chaos = (dissolution - 0.6) / 0.4;
		float noise = fract(sin(dot(uv * 8.0 + TIME * 0.1, vec2(13.0, 78.2))) * 43758.5);
		opacity += noise * chaos * base_opacity * 0.5;
	}

	COLOR = vec4(final_color.rgb, clamp(opacity, 0.0, 1.0));
}
