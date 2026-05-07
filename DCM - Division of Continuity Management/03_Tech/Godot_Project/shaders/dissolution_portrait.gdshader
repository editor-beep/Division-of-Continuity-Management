// dissolution_portrait.gdshader
// Godot 4 canvas_item shader for the player's evolving portrait.
// At dissolution_level = 0: renders the source texture (or built-in silhouette).
// As dissolution rises: geometric patterns emerge, overlaying and replacing
// the human portrait with a glowing sacred mandala sigil.
shader_type canvas_item;

/// Driven by dissolution_index / 100.
uniform float dissolution_level: hint_range(0.0, 1.0) = 0.0;
uniform vec4 sigil_color: source_color = vec4(1.0, 0.690, 0.0, 1.0);
uniform vec4 mythic_color: source_color = vec4(0.549, 0.306, 1.0, 1.0);
uniform sampler2D SCREEN_TEXTURE: hint_screen_texture, filter_linear_mipmap;
/// When true the shader draws its own procedural silhouette instead of
/// sampling TEXTURE. Set this to true on ColorRect portrait nodes that
/// have no source image assigned.
uniform bool use_generated_silhouette: hint_default_true = true;

// ── SDF helpers for the procedural silhouette ─────────────────────────────────

float sdf_circle(vec2 uv, vec2 center, float r) {
	return length(uv - center) - r;
}

float sdf_rect(vec2 uv, vec2 center, vec2 half_size) {
	vec2 d = abs(uv - center) - half_size;
	return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

/// Returns the blended skin / body colour for a humanoid silhouette at UV.
vec4 generate_silhouette(vec2 uv) {
	vec4 bg       = vec4(0.10, 0.09, 0.12, 1.0);
	vec4 skin     = vec4(0.72, 0.67, 0.61, 1.0);
	vec4 shoulder = vec4(0.48, 0.44, 0.40, 1.0);

	// Head circle centred at (0.5, 0.28), radius ≈ 0.17
	float head = sdf_circle(uv, vec2(0.5, 0.28), 0.17);

	// Neck — thin vertical rect
	float neck = sdf_rect(uv, vec2(0.5, 0.475), vec2(0.068, 0.055));

	// Body / shoulder block — wide rect clipped by diagonal shoulder cuts
	float body = sdf_rect(uv, vec2(0.5, 0.73), vec2(0.40, 0.27));
	// Taper: cut away upper corners so the silhouette tapers from head to body
	float left_taper  = (uv.x - 0.5) - 1.8 * (uv.y - 0.54);
	float right_taper = -(uv.x - 0.5) - 1.8 * (uv.y - 0.54);
	body = max(body, max(left_taper, right_taper) - 0.04);

	float figure = min(min(head, neck), body);

	if (figure < 0.0) {
		// Blend skin (upper) into shoulder tone (lower)
		float blend = smoothstep(0.32, 0.58, uv.y);
		return mix(skin, shoulder, blend);
	}
	return bg;
}

// ── Geometric overlay helpers ─────────────────────────────────────────────────

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

	// Resolve the base portrait: procedural silhouette or source texture.
	vec4 original;
	if (use_generated_silhouette) {
		original = generate_silhouette(uv);
	} else {
		original = texture(TEXTURE, uv);
	}

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
