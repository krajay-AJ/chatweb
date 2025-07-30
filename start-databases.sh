#!/bin/bash

# Start all databases for ChatWeb application
echo "Starting ChatWeb databases..."


# Start PostgreSQL
echo "Checking PostgreSQL (port 5432)..."
if ss -tlnp | grep -q ":5432"; then
    echo "✓ PostgreSQL is already running on port 5432"
else
    echo "Starting PostgreSQL using system service..."
    sudo service postgresql start
    sleep 3
    if ss -tlnp | grep -q ":5432"; then
        echo "✓ PostgreSQL started successfully"
    else
        echo "✗ Failed to start PostgreSQL"
    fi
fi

# Start MongoDB
echo "Checking MongoDB (port 27017)..."
if ss -tlnp | grep -q ":27017"; then
    echo "✓ MongoDB is already running on port 27017"
else
    echo "Starting MongoDB with config file..."
    sudo mongod --config /etc/mongod.conf --fork
    sleep 3
    if ss -tlnp | grep -q ":27017"; then
        echo "✓ MongoDB started successfully"
    else
        echo "✗ Failed to start MongoDB"
    fi
fi

# Start Redis
echo "Checking Redis (port 6379)..."
if ss -tlnp | grep -q ":6379"; then
    echo "✓ Redis is already running on port 6379"
else
    echo "Starting Redis..."
    redis-server --daemonize yes &
    sleep 2
    if ss -tlnp | grep -q ":6379"; then
        echo "✓ Redis started successfully"
    else
        echo "✗ Failed to start Redis"
    fi
fi

echo ""
echo "Database Status:"
echo "=================="
if ss -tlnp | grep -q ":5432"; then
    echo "✓ PostgreSQL: Running on port 5432"
else
    echo "✗ PostgreSQL: Not running"
fi
if ss -tlnp | grep -q ":27017"; then
    echo "✓ MongoDB: Running on port 27017"
else
    echo "✗ MongoDB: Not running"
fi
if ss -tlnp | grep -q ":6379"; then
    echo "✓ Redis: Running on port 6379"
else
    echo "✗ Redis: Not running"
fi

echo ""
echo "All databases are ready for ChatWeb application!"
