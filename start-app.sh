#!/bin/bash

# Start ChatWeb application (backend and frontend)
echo "Starting ChatWeb Application..."

# Function to check if a port is in use
check_port() {
    if ss -tlnp | grep -q ":$1"; then
        return 0
    else
        return 1
    fi
}

# Check databases first
echo "Checking databases..."
if ! ss -tlnp | grep -q ":5432"; then
    echo "✗ PostgreSQL is not running. Please start it first."
    exit 1
fi

if ! ss -tlnp | grep -q ":27017"; then
    echo "✗ MongoDB is not running. Please start it first."
    exit 1
fi

if ! ss -tlnp | grep -q ":6379"; then
    echo "✗ Redis is not running. Please start it first."
    exit 1
fi

echo "✓ All databases are running"

# Start backend server
echo ""
echo "Starting backend server on port 3001..."
cd /home/mat-rix/chatweb/server
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Check if backend started
if check_port 3001; then
    echo "✓ Backend server started successfully on port 3001"
else
    echo "⚠ Backend server may still be starting..."
fi

# Start frontend server
echo ""
echo "Starting frontend server on port 3000..."
cd /home/mat-rix/chatweb/client
npm start &
FRONTEND_PID=$!

# Wait a bit for frontend to start
sleep 5

# Check if frontend started
if check_port 3000; then
    echo "✓ Frontend server started successfully on port 3000"
else
    echo "⚠ Frontend server may still be starting..."
fi

echo ""
echo "ChatWeb Application Status:"
echo "==========================="
echo "Backend (API): http://localhost:3001"
echo "Frontend (App): http://localhost:3000"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop the application, run: pkill -f 'npm'"
