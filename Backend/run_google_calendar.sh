#!/bin/zsh
# Activate the Python 3.12 virtual environment and run google_calendar.py

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VENV_DIR="$SCRIPT_DIR/../venv"

if [ -d "$VENV_DIR" ]; then
    source "$VENV_DIR/bin/activate"
    python google_calendar.py
else
    echo "Virtual environment not found at $VENV_DIR. Please set it up first."
    exit 1
fi
