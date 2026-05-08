THE DIVISION OF CONTINUITY MANAGEMENT 04_Variables_And_State.md (Official System Schema)

Core Philosophy
All state is centralized in a single ContinuityState manager (Godot Autoload / Singleton or equivalent). Everything the player does feeds into a web of interconnected variables. There are no purely cosmetic choices — every decision creates measurable ripples.

1. Player State (Your File)
These persist across days and are saved.
Variable
Type
Range
Default
Description
dissolution_index
float
0.0 – 100.0
4.2
How much “you” have been processed. Primary progression meter.
efficiency_score
float
0 – 100
65.0
How “well” you serve the system.
continuity_contribution
float
0 – 1000
0
Cumulative impact on reality.
clearance_level
int
1 – 9
1
Unlocks deeper forms, more dangerous cases, self-editing.
mythic_residue
float
0 – 100
12.0
How much archetypal weight you still carry.
narrative_stability
float
0 – 100
78.0
How coherent your personal story is.
emotional_surplus
float
-100 – 100
8.0
Your own unprocessed feelings.
flags
Dictionary / Set
-
-
Boolean flags (e.g. childhood_compressed, grief_commercialized, echo_awareness)
Hidden / Derived:
	•	player_portrait_stage (0–5): Visual evolution of your file portrait.
	•	unraveling_risk (calculated from several above).

2. Global / World State
Variable
Type
Range
Default
Description
reality_stability
float
0 – 100
92.0
Overall health of consensus reality.
department_strain
float
0 – 100
15.0
How overloaded the Division is.
unraveling_events
int
0 – ∞
0
Counter for major anomalies triggered.
mythic_commodities_index
float
0 – 200
100.0
Supply of usable archetypes.
collective_nostalgia
float
0 – 100
45.0
Cultural mood variable.
era
enum
Act1–Act3
Act1
Story progression chapter.

3. Case / Session State (Reset or partially carried per day)
	•	current_day (int)
	•	daily_cases_processed (int)
	•	daily_efficiency (temp score for the day)
	•	active_case_id (string)
	•	pending_ripples (array of delayed effects)

4. Decision Tracking (Key Flags & Counters)
These are the most important for branching and endings:
Major Thematic Tracks:
	•	grief_handling_style → “Commercialized”, “Repressed”, “Preserved”, “Weaponized”
	•	childhood_policy → “Fully_Compressed”, “Selectively_Preserved”, “Wild”
	•	narrative_control → “Strict”, “Balanced”, “Permissive”
	•	self_treatment → “Optimizing”, “Protective”, “Sabotaging”
	•	echo_interactions → count + attitude toward your own fragments
Specific Case Memory Flags (examples):
	•	marcus_hobby_liquidated
	•	elena_grief_rerouted
	•	theo_childhood_compressed
	•	etc.

5. Ripple & Consequence System
Every major decision writes to a Ripple Queue. At end-of-day (or end-of-act), these are resolved:
	•	Small ripples: Minor flavor text (“A gentle wave of engineered melancholy settled over Sector 7”)
	•	Medium ripples: Modify global variables + unlock future cases
	•	Major ripples: Trigger special events, new case types, or ending branches
Example Mapping:
	•	High dissolution_index + High efficiency → Machine-like clarity path
	•	High emotional_surplus + Low narrative_stability → Rebellion / Empathy path
	•	High mythic_residue → Ascension / Anomaly path

6. Save System Design
	•	Auto-save at end of every case + end of day.
	•	One primary save slot + New Game+ slot.
	•	New Game+ carries: dissolution_index, selected major flags, clearance bonuses, and “echo memories”.

7. Implementation Notes (Godot-friendly)
# Suggested structure
class_name ContinuityState
extends Node

var player: PlayerState
var world: WorldState
var flags: Dictionary = {}
var ripple_queue: Array = []

signal state_changed(key, new_value)
signal major_ripple(resolution_data)
	•	Use Resource classes for PlayerState and WorldState if you want easy saving.
	•	All UI elements should bind to these via signals for live updates (Dissolution bar breathing, color shifts, etc.).
	•	Thresholds trigger visual & narrative changes:
	◦	Dissolution > 30% → subtle geometry increase
	◦	Dissolution > 70% → self-referential cases appear

This schema is now canon and complete for MVP.
It is deliberately over-specified so we can start lean (implement Player + 5–6 key variables first) and expand naturally.

Current Status Summary
	•	Metaphysics ✓
	•	Tone & Voice ✓
	•	Visual Guide ✓
	•	Variables & State ✓

Next Move? Choose one:
	1	Clean, production-ready Day 1 cases (formatted as actual data structures + outcomes)
	2	Godot project setup guide (step-by-step)
	3	Generate UI mockups (Login, Main Terminal, Sample Form, Player File) based on the Visual Guide
	4	Player’s Own Continuity File screen design + content
	5	Something else
Just reply with the number or name. We now have a solid technical and artistic foundation. The machine has its nervous system.
