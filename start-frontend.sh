#!/bin/bash

# Start ChatWeb Frontend Application
echo "Starting ChatWeb Frontend Application..."

# Check if frontend is already running
if ss -tlnp | grep -q ":3000"; then
    echo "✓ Frontend is already running on port 3000"
    exit 0
fi

# Navigate to client directory
cd /home/mat-rix/chatweb/client

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start the frontend server
echo "Starting frontend server on port 3000..."
npm start &
FRONTEND_PID=$!

# Wait a bit for server to start
sleep 10

# Check if frontend started successfully
if ss -tlnp | grep -q ":3000"; then
    echo "✓ Frontend server started successfully on port 3000"
    echo "Frontend PID: $FRONTEND_PID"
    echo ""
    echo "Frontend application is available at: http://localhost:3000"
    echo "You can now access the ChatWeb application in your browser!"
else
    echo "⚠ Frontend server may still be starting..."
    echo "Please wait a moment and check http://localhost:3000"
fi
