#!/bin/bash

# Start all databases for ChatWeb application (direct startup)
echo "Starting ChatWeb databases..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Start PostgreSQL
echo "Checking PostgreSQL (port 5432)..."
if check_port 5432; then
    echo "✓ PostgreSQL is already running on port 5432"
else
    echo "Starting PostgreSQL..."
    sudo -u postgres pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start &
    sleep 3
    if check_port 5432; then
        echo "✓ PostgreSQL started successfully"
    else
        echo "✗ Failed to start PostgreSQL"
    fi
fi

# Start MongoDB
echo "Checking MongoDB (port 27017)..."
if check_port 27017; then
    echo "✓ MongoDB is already running on port 27017"
else
    echo "Starting MongoDB..."
    sudo mongod --fork --logpath /var/log/mongodb/mongod.log --dbpath /var/lib/mongodb &
    sleep 3
    if check_port 27017; then
        echo "✓ MongoDB started successfully"
    else
        echo "✗ Failed to start MongoDB"
    fi
fi

# Start Redis
echo "Checking Redis (port 6379)..."
if check_port 6379; then
    echo "✓ Redis is already running on port 6379"
else
    echo "Starting Redis..."
    redis-server --daemonize yes &
    sleep 2
    if check_port 6379; then
        echo "✓ Redis started successfully"
    else
        echo "✗ Failed to start Redis"
    fi
fi

echo ""
echo "Database Status:"
echo "=================="

# Check all services
if check_port 5432; then
    echo "✓ PostgreSQL: Running on port 5432"
else
    echo "✗ PostgreSQL: Not running"
fi

if check_port 27017; then
    echo "✓ MongoDB: Running on port 27017"
else
    echo "✗ MongoDB: Not running"
fi

if check_port 6379; then
    echo "✓ Redis: Running on port 6379"
else
    echo "✗ Redis: Not running"
fi

echo ""
echo "All databases are ready for ChatWeb application!"
