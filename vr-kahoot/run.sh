#!/bin/bash

# VR Kahoot - AWS Free Tier Local Runner
# Optimized for lightweight deployment on t2.micro

# Exit on error
set -e

echo "🚀 Starting VR Kahoot (Free Tier Mode)..."

# Check available memory
AVAILABLE_MEM=$(free -m | grep ^Mem | awk '{print $7}')
echo "💾 Available memory: ${AVAILABLE_MEM}MB"

if [ $AVAILABLE_MEM -lt 200 ]; then
    echo "⚠️  WARNING: Low memory detected! Consider stopping other services."
fi

# --- Cleanup any existing processes ---
echo "🧹 Cleaning up any existing processes..."
pkill -f "node server.js" || true
pkill -f "python3 main.py" || true
pkill -f "python main.py" || true
sleep 2

# --- Start Servers (Free Tier Method) ---
echo "🎮 Starting Avatar Server in the background..."
(cd avatar-server && nohup node server.js > ../avatar-server.log 2>&1 &)
AVATAR_PID=$!

echo "🎯 Starting Main Game Server..."
# Use 'trap' to ensure cleanup happens on exit
trap "kill $AVATAR_PID 2>/dev/null || true" EXIT

# Check if conda is available (optional - but prefer virtual environment)
if command -v conda &> /dev/null && [ -z "$VIRTUAL_ENV" ]; then
    echo "🐍 Conda detected, trying to activate environment..."
    # Initialize conda for this shell session
    eval "$(conda shell.bash hook)" 2>/dev/null || eval "$(/home/$USER/miniconda3/bin/conda shell.bash hook)" 2>/dev/null || eval "$(/home/$USER/anaconda3/bin/conda shell.bash hook)" 2>/dev/null
    
    # Try to activate environment, fallback to virtual environment if it fails
    if conda activate vivitsu 2>/dev/null; then
        echo "✅ Using conda environment: vivitsu"
        python main.py
    else
        echo "⚠️  Conda environment 'vivitsu' not found, using virtual environment"
        source venv/bin/activate
        python main.py
    fi
else
    echo "🐍 Using virtual environment..."
    source venv/bin/activate
    python main.py
fi

# --- Cleanup ---
# The trap command above will handle the cleanup.
# When the python server is stopped (Ctrl+C), it will kill the avatar server.

