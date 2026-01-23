#!/bin/bash
# ============================================
# Aniways Startup Script (Linux/Mac)
# Usage: chmod +x start.sh && ./start.sh
# ============================================

echo "Starting Aniways..."

DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend (venv is in project root)
(cd "$DIR/backend" && source "$DIR/.venv/bin/activate" && python server.py) &
BACKEND_PID=$!

# Wait for backend
sleep 2

# Start frontend
(cd "$DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "Backend: http://localhost:4444"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
