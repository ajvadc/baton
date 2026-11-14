#!/usr/bin/env bash
set -e

echo "==================================================="
echo "              Starting Baton Platform              "
echo "  Knowledge Handover with Verifiable Evidence      "
echo "==================================================="

# Start backend
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python3 -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "Baton is running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000/docs"

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
