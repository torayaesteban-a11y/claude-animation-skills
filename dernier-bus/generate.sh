#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
npm ci
.venv/bin/python voice.py
.venv/bin/python mix.py
node render.mjs
bash export.sh ../sortie/Le-dernier-bus-03h00.mp4
.venv/bin/python verify.py ../sortie/Le-dernier-bus-03h00.mp4
cp ../sortie/Le-dernier-bus-03h00.mp4 ../Le-dernier-bus-03h00.mp4
