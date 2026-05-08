// crt.gdshader
// Godot 4 canvas_item shader that simulates a CRT monitor.
// Applies screen curvature, scanlines, vignette, chromatic aberration,
// and subtle flicker. Intensity of distortion increases with dissolution_factor.
shader_type canvas_item;

uniform float curvature: hint_range(0.0, 10.0) = 2.0;
uniform float scanline_intensity: hint_range(0.0, 1.0) = 0.08;
uniform float vignette_strength: hint_range(0.0, 2.0) = 0.5;
uniform float chromatic_aberration_strength: hint_range(0.0, 0.02) = 0.003;
uniform float flicker_intensity: hint_range(0.0, 0.1) = 0.008;
uniform float screen_width: hint_range(100.0, 3840.0) = 1280.0;
uniform float screen_height: hint_range(100.0, 2160.0) = 720.0;
/// Driven by ContinuityState.dissolution_index / 100. Increases visual corruption.
uniform float dissolution_factor: hint_range(0.0, 1.0) = 0.0;

void fragment() {
	vec2 uv = UV;

	// Screen curvature distortion
	vec2 curved = uv * 2.0 - 1.0;
	vec2 offset = curved.yx * curved.yx * curvature * 0.008;
	curved += curved * offset;
	uv = curved * 0.5 + 0.5;

	// Clip to curved screen area
	if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
		COLOR = vec4(0.0, 0.0, 0.0, 1.0);
		return;
	}

	// Chromatic aberration (R shifts right, B shifts left)
	float ca = chromatic_aberration_strength * (1.0 + dissolution_factor * 3.0);
	float r = texture(TEXTURE, uv + vec2(ca, 0.0)).r;
	float g = texture(TEXTURE, uv).g;
	float b = texture(TEXTURE, uv - vec2(ca, 0.0)).b;
	float a = texture(TEXTURE, uv).a;
	vec3 col = vec3(r, g, b);

	// Scanlines — one dark band per pixel row
	float line = sin(uv.y * screen_height * PI);
	col *= 1.0 - scanline_intensity * (1.0 - (line * 0.5 + 0.5));

	// Horizontal bloom on bright lines (mimics phosphor glow)
	float brightness = dot(col, vec3(0.299, 0.587, 0.114));
	col += vec3(0.0, 0.0, 0.0) * (brightness * brightness * 0.05);

	// Vignette — darken corners
	vec2 vig = uv * 2.0 - 1.0;
	float vignette = 1.0 - dot(vig, vig) * vignette_strength * 0.4;
	col *= clamp(vignette, 0.0, 1.0);

	// Subtle flicker — varies by time and Y position
	float flicker = 1.0 - flicker_intensity * fract(
		sin(TIME * 53.1 + uv.y * 7.3) * 4231.1
	);
	col *= flicker;

	// Dissolution visual corruption: purple chromatic noise at high dissolution
	if (dissolution_factor > 0.5) {
		float excess = (dissolution_factor - 0.5) * 2.0;
		float noise = fract(
			sin(dot(uv + vec2(TIME * 0.07), vec2(12.989, 78.233))) * 43758.545
		);
		// Purple (mythic residue) tint bleeds in
		col += noise * excess * 0.04 * vec3(0.549, 0.306, 1.0);
		// Occasional horizontal tear at very high dissolution
		if (dissolution_factor > 0.85) {
			float tear_chance = fract(sin(TIME * 2.3 + floor(uv.y * 30.0)) * 317.5);
			if (tear_chance > 0.97) {
				float shift = (fract(sin(TIME) * 137.5) - 0.5) * 0.03 * (dissolution_factor - 0.85) * 6.0;
				col = mix(col, texture(TEXTURE, uv + vec2(shift, 0.0)).rgb, 0.6);
			}
		}
	}

	COLOR = vec4(col, a);
}
