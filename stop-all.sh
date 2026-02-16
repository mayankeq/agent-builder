#!/bin/bash

# Synthient - Stop All Services

echo "🛑 Stopping Synthient services..."

# Kill processes by PID if PID files exist
if [ -f ".backend.pid" ]; then
    kill $(cat .backend.pid) 2>/dev/null && echo "✅ Backend stopped"
    rm .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    kill $(cat .frontend.pid) 2>/dev/null && echo "✅ Frontend stopped"
    rm .frontend.pid
fi

if [ -f ".website.pid" ]; then
    kill $(cat .website.pid) 2>/dev/null && echo "✅ Marketing website stopped"
    rm .website.pid
fi

# Kill any remaining processes on these ports
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

echo "✅ All services stopped"
