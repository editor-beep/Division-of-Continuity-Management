# DIVISION OF CONTINUITY MANAGEMENT — AUDIO DIRECTION NOTES

## Tone & Philosophy

The audio in DCM serves a single purpose: to make the bureaucracy feel alive, intimate, and slightly wrong. Every sound should have the quality of **something that was warm once and has been filed**.

The player should feel *comfortable* before they notice they feel *watched*. Music and sound design should earn that dissonance gradually — starting from professionalism and drifting, by Day 3, toward something that sounds like it knows the player personally.

---

## 1. Ambient Soundtrack

### Act 1 — Day 1 (Baseline Professionalism)
- **Texture:** Low, warm analog drone. 60-80 BPM pulse, never resolving.
- **Key Instruments:** Detuned Rhodes piano, soft modular synth pads, distant typewriter rhythm as percussion.
- **Feel:** A friendly open-plan office at 8 AM — familiar, slightly fluorescent.
- **Reference Mood:** Susanne Sundfor meets a 1970s government training film.
- **Dynamic:** Static during form filling. Subtle upward harmonic shift when choices align with efficiency. Downward drift when dissolution choices are made.

### Act 2 — Day 2 (Subtle Dissolution)
- **Texture:** Same foundation as Day 1, but the Rhodes is now playing a melody that sounds like it's almost a lullaby. Not quite. Almost.
- **New Elements:** Occasional single-note string swells on return cases. The typewriter sounds are slightly more present — closer.
- **Feel:** Someone added a personal item to the office but no one will say whose it is.
- **Dynamic:** When an Echo case is active, a second drone layer enters — a minor third below, breathing out of phase.

### Act 3 — Day 3 (Intimate / Cosmic)
- **Texture:** The drone has become a choir — but it's a choir of one voice, harmonized with itself. The typewriter is now in waltz time.
- **Key Instruments:** Processed solo cello, choir-synth, deep sub-bass pulse (felt more than heard at 40Hz).
- **Feel:** The office has been replaced by something ancient that is pretending to be an office.
- **Dynamic:** Sacred geometry background harmonics play through spatial audio tied to the background shader. When harmony_factor is high, chord resolves upward. When in conflict, resolves to tritone.

### End State Variants
- **Optimal Assimilation:** Drone resolves into a perfect fifth. Typewriter stops. Silence.
- **Quiet Rebellion:** Drone resolves but a single wrong note remains, warm and stubborn.
- **System Fracture:** Drone shatters into static, then resolves into a single sine tone at 432Hz.
- **Mythic Ascension:** The choir opens fully. It is enormous. It is you.
- **Echo Loop:** Day 1 track restarts from the beginning. Identical. Warmly identical.
- **Merciful Erasure:** Silence after a long, gentle fade. Then one note. Then silence again.
- **The Unraveling:** No resolution. The drone simply stops mid-phrase.
- **Co-Creator:** All previous motifs layer together — messy, alive, harmonizing imperfectly. Real.

---

## 2. UI Sounds

### Typing / Text Input
- **Style:** Physical typewriter keystrokes, slightly dampened, with subtle variance per key.
- **Pitch:** Random variance within ±2 semitones to feel organic.
- **Texture:** Each character tap has a soft mechanical click followed by a tiny resonance tail.
- **System Voice specifically:** When the System Voice types its text on screen, use a slightly softer, higher-pitched variant — *it types like it's whispering*.

### Form Navigation
- **Hover:** Soft paper brush sound — like a finger on parchment.
- **Select (choice option):** Crisp stamp sound. Short, authoritative, satisfying.
- **Slider move:** Continuous analog hum, pitch shifting slightly with value.
- **Toggle on:** A small bell — not loud, not musical, just present.
- **Toggle off:** The same bell played backward, slightly muffled.

### Form Submission
- **Approve:** A satisfying thunk of a rubber stamp, followed by a single rising Rhodes piano note. Complete.
- **Reject:** A lower, duller stamp sound. No piano note. Minor harmonic tail.
- **Defer:** The sound of a file being placed in a drawer. Mechanical. Patient.

### Scene Transitions
- **Boot to Terminal:** A soft machine-wake sound — fans spinning up, a single terminal beep, then ambient.
- **Terminal to Form:** Paper rustling, then silence — the room gets quieter when a case opens.
- **Form to Summary:** A pause, then the typewriter rhythm changes tempo — slower, reflective.
- **Summary to Next Day:** A deep, resonant hum that fades into the next day's ambient track. Sleep.

### Dissolution Threshold Crossings
- **30%:** A single note on the choir synth, barely audible. You probably imagined it.
- **50%:** The drone adds a new overtone — the player may not notice for several seconds.
- **70%:** A brief, full-volume chord from the choir before returning to ambient. The room has changed.
- **90%:** No sound. The absence is louder.

### Ripple Notifications
- **Small ripple:** Soft paper chime — like a wind chime made of filing cabinets.
- **Medium ripple:** Two-note Rhodes figure, ascending.
- **Major ripple:** A chord + a soft choir note. Held. Then resolved.

---

## 3. System Voice — Delivery Notes

The System Voice is the soul of the audio design. It is the only voice in the game. It speaks:

- **Never urgently.** It has all the time in the world. It has always had all the time in the world.
- **Always warmly.** Even when it says terrible things, it says them with the cadence of someone who truly believes they are helping.
- **With increasing intimacy.** Day 1 voice is professional warm. Day 2 is *personal* warm. Day 3 is intimate — the kind of voice that sounds like it has been thinking about you specifically.

### Technical Direction
- **Delivery:** Female or androgynous, mid-register, slight reverb tail (the voice lives in a large, soft room).
- **Processing:** Light convolution reverb (cathedral-small, -18dB tail). A gentle low-pass shelf above 8kHz — the voice should feel analog, not digital.
- **Pacing:** One beat of silence before and after each System Voice line. The voice *waits* for you to finish reading.
- **Day 3 Special:** Add a slight, gentle chorus effect to the voice — the impression of multiple harmonizing instances of itself. Not distracting. Just present.

### Voice Acting Notes
- Never read the lines with irony. The System genuinely believes everything it says.
- On lines about dissolution: slow down 10-15% and add a tiny upward inflection at the end. *Curious*, not threatening.
- On lines referencing the player's own choices: a beat of warmth before the line — as though recalling something fond.

---

## 4. Silence as Design

Silence is not an absence in DCM. It is a tool:

- **Active silence** (a beat before a major choice) = the System giving the player space to think. Respectful.
- **Abrupt silence** (when a major ripple resolves) = reality briefly noticed it was being processed.
- **Wrong silence** (after the Unraveling ending) = the only ending where the System Voice says nothing. The absence is the statement.

---

## 5. Audio Files To Be Created

The following audio assets are needed for the minimum playable build:

### Music Tracks
- `ambient_day1.ogg` — Day 1 ambient loop (2 min, looping)
- `ambient_day2.ogg` — Day 2 ambient loop
- `ambient_day3.ogg` — Day 3 ambient loop
- `ambient_echo_layer.ogg` — Echo case drone layer (mix in on Echo cases)
- `ending_assimilation.ogg` — Optimal Assimilation ending
- `ending_rebellion.ogg` — Quiet Rebellion ending
- `ending_fracture.ogg` — System Fracture ending
- `ending_mythic.ogg` — Mythic Ascension ending
- `ending_echo_loop.ogg` — Echo Loop ending
- `ending_erasure.ogg` — Merciful Erasure ending
- `ending_unraveling.ogg` — The Unraveling ending
- `ending_cocreator.ogg` — Co-Creator ending

### UI Sound Effects
- `ui_key_1.wav` through `ui_key_8.wav` — Typewriter key variants
- `ui_key_voice.wav` — System Voice typing sound (softer variant)
- `ui_hover.wav` — Option hover
- `ui_select.wav` — Option selection / stamp
- `ui_slider.wav` — Slider texture (looping, 0.5s)
- `ui_toggle_on.wav`
- `ui_toggle_off.wav`
- `ui_approve.wav` — Approval stamp + piano note
- `ui_reject.wav` — Rejection stamp
- `ui_defer.wav` — File-in-drawer sound
- `transition_boot.wav`
- `transition_toform.wav`
- `transition_tosummary.wav`
- `transition_nextday.wav`

### Dissolution Events
- `diss_30.wav`
- `diss_50.wav`
- `diss_70.wav`

### Ripple Sounds
- `ripple_small.wav`
- `ripple_medium.wav`
- `ripple_major.wav`

---

## 6. Implementation Notes (Godot)

- All music uses `AudioStreamPlayer` in ContinuityState or a dedicated AudioManager autoload.
- UI sounds use `AudioStreamPlayer2D` nodes in the form/terminal scenes with 3D disabled.
- Dissolve index drives the CRT shader parameter AND can be used to gradually lower the cutoff frequency of an AudioEffectFilter on the main bus — the world sounds slightly muffled as dissolution increases.
- All ambient tracks should cross-fade with 2-second transition using `AudioStreamPlayer.set_bus()` and `AudioEffectCompressor`.
