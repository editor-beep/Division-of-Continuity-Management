// dissolution_portrait.gdshader
// Godot 4 canvas_item shader for the player's evolving portrait.
// At dissolution_level = 0: renders the source texture normally.
// As dissolution rises: geometric patterns emerge, overlaying and replacing
// the human portrait with a glowing sacred mandala sigil.
shader_type canvas_item;

/// Driven by dissolution_index / 100.
uniform float dissolution_level: hint_range(0.0, 1.0) = 0.0;
uniform vec4 sigil_color: source_color = vec4(1.0, 0.690, 0.0, 1.0);
uniform vec4 mythic_color: source_color = vec4(0.549, 0.306, 1.0, 1.0);
uniform sampler2D SCREEN_TEXTURE: hint_screen_texture, filter_linear_mipmap;

// Concentric-ring pattern for the geometric overlay
float geo_rings(vec2 uv, float rings, float speed) {
	vec2 centered = uv * 2.0 - 1.0;
	float dist = length(centered);
	return step(0.5, sin(dist * rings - TIME * speed) * 0.5 + 0.5);
}

// Radial line spokes
float geo_spokes(vec2 uv, float count) {
	vec2 centered = uv * 2.0 - 1.0;
	float angle = atan(centered.y, centered.x);
	return step(0.5, sin(angle * count) * 0.5 + 0.5) * 0.4;
}

// Fine grid
float geo_grid(vec2 uv, float density) {
	float gx = step(0.97, sin(uv.x * density) * 0.5 + 0.5);
	float gy = step(0.97, sin(uv.y * density) * 0.5 + 0.5);
	return (gx + gy) * 0.3;
}

void fragment() {
	vec2 uv = UV;
	vec4 original = texture(TEXTURE, uv);

	// At zero dissolution, render the original portrait unchanged
	if (dissolution_level < 0.01) {
		COLOR = original;
		return;
	}

	float d = dissolution_level;

	// Build the geometric overlay
	float rings      = geo_rings(uv, 14.0 * (1.0 + d * 2.0), 0.6);
	float spokes     = geo_spokes(uv, 6.0 + d * 6.0);
	float grid_fine  = geo_grid(uv, 24.0 + d * 16.0);
	float geo        = clamp(rings + spokes + grid_fine, 0.0, 1.0);

	// Inner glow circle at the centre of the portrait
	vec2 centered = uv * 2.0 - 1.0;
	float center_glow = smoothstep(0.6, 0.0, length(centered)) * d * 0.8;

	// Interpolate: original → geometric sigil
	float geo_weight = d * d;  // quadratic — slow start, fast finish

	// Colour: mix sigil_color and mythic_color based on echo_interactions proxy
	vec4 geo_col = mix(sigil_color, mythic_color, d * 0.5);

	// Compose: original fades, geo overlay strengthens
	vec4 result = mix(original, geo_col * vec4(vec3(0.5 + geo * 0.5), 1.0), geo_weight * geo);
	result += geo_col * center_glow;

	// Noise-based dissolution: pixels flicker to gold at very high dissolution
	if (d > 0.7) {
		float threshold = (d - 0.7) / 0.3;
		float noise = fract(sin(dot(uv + vec2(TIME * 0.03), vec2(12.98, 78.23))) * 43758.5);
		if (noise < threshold * threshold) {
			result = mix(result, sigil_color, threshold * 0.7);
		}
	}

	// At full dissolution: portrait becomes pure golden sigil
	if (d >= 0.99) {
		result = mix(result, sigil_color * (0.8 + geo * 0.2), 0.9);
	}

	COLOR = result;
}
