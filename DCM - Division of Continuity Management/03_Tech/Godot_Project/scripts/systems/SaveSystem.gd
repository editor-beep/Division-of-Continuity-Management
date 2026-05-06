## SaveSystem.gd
## Handles saving and loading of the ContinuityState to disk.
## Autoloaded singleton. Auto-saves on case completion and day end.
extends Node

const SAVE_PATH_PRIMARY  := "user://continuity_save.json"
const SAVE_PATH_NG_PLUS  := "user://continuity_save_ng.json"

signal game_saved
signal game_loaded
signal save_failed(reason: String)

var _save_path_active: String = SAVE_PATH_PRIMARY

func _ready() -> void:
	ContinuityState.case_completed.connect(_on_case_completed)
	ContinuityState.day_ended.connect(_on_day_ended)

# ── Public API ────────────────────────────────────────────────────────────────

func save_game(path: String = "") -> bool:
	var target_path: String = path if path != "" else _save_path_active
	var data: Dictionary = ContinuityState.to_dict()
	data["_meta"] = {
		"save_version": "1.0.0",
		"timestamp": Time.get_unix_time_from_system(),
		"game_version": ProjectSettings.get_setting("application/config/name", "DCM"),
	}
	var json_text: String = JSON.stringify(data, "\t")
	var file := FileAccess.open(target_path, FileAccess.WRITE)
	if file == null:
		var err_msg := "Could not open save file for writing: %s" % target_path
		push_error(err_msg)
		save_failed.emit(err_msg)
		return false
	file.store_string(json_text)
	file.close()
	game_saved.emit()
	return true

func load_game(path: String = "") -> bool:
	var target_path: String = path if path != "" else _save_path_active
	if not FileAccess.file_exists(target_path):
		return false
	var file := FileAccess.open(target_path, FileAccess.READ)
	if file == null:
		push_error("Could not open save file for reading: %s" % target_path)
		return false
	var json_text: String = file.get_as_text()
	file.close()
	var data: Variant = JSON.parse_string(json_text)
	if data == null or not data is Dictionary:
		push_error("SaveSystem: Malformed save file at %s" % target_path)
		return false
	ContinuityState.from_dict(data)
	game_loaded.emit()
	return true

func has_save(ng_plus: bool = false) -> bool:
	var path: String = SAVE_PATH_NG_PLUS if ng_plus else SAVE_PATH_PRIMARY
	return FileAccess.file_exists(path)

func delete_save(ng_plus: bool = false) -> void:
	var path: String = SAVE_PATH_NG_PLUS if ng_plus else SAVE_PATH_PRIMARY
	if FileAccess.file_exists(path):
		DirAccess.remove_absolute(path)

func start_ng_plus() -> void:
	_save_path_active = SAVE_PATH_NG_PLUS
	ContinuityState.set_flag("new_game_plus", true)

## Return a human-readable timestamp from save metadata, or "" if no save.
func get_save_timestamp(ng_plus: bool = false) -> String:
	var path: String = SAVE_PATH_NG_PLUS if ng_plus else SAVE_PATH_PRIMARY
	if not FileAccess.file_exists(path):
		return ""
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return ""
	var data: Variant = JSON.parse_string(file.get_as_text())
	file.close()
	if data == null or not data is Dictionary:
		return ""
	var meta: Dictionary = data.get("_meta", {})
	var unix_time: float = meta.get("timestamp", 0.0)
	if unix_time == 0.0:
		return ""
	var dt: Dictionary = Time.get_datetime_dict_from_unix_time(int(unix_time))
	return "%04d-%02d-%02d  %02d:%02d" % [dt.year, dt.month, dt.day, dt.hour, dt.minute]

# ── Internal Callbacks ────────────────────────────────────────────────────────

func _on_case_completed(_case_id: String) -> void:
	save_game()

func _on_day_ended(_day: int) -> void:
	save_game()
