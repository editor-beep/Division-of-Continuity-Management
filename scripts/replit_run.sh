#!/usr/bin/env bash
set -euo pipefail

godot4 --headless --path 03_Tech/Godot_Project --export-release Web build/web/index.html
python3 -m http.server 3000 --directory 03_Tech/Godot_Project/build/web
