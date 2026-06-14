#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting FastAPI backend..."
(cd "$SCRIPT_DIR/fastapiBackend" && uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

echo "Starting frontend..."
(cd "$SCRIPT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo "Starting VR Kahoot..."
(cd "$SCRIPT_DIR" && ./vr-kahoot/run.sh) &
VR_PID=$!

echo "All services started."
echo "  Backend PID:  $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo "  VR Kahoot PID: $VR_PID"
echo "Press Ctrl+C to stop all services."

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID $VR_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
