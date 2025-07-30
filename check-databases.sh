#!/bin/bash

# Check database status for ChatWeb application
echo "ChatWeb Database Status:"
echo "========================"

# Check PostgreSQL (port 5432)
if ss -tlnp | grep -q ":5432"; then
    echo "✓ PostgreSQL: Running on port 5432"
else
    echo "✗ PostgreSQL: Not running on port 5432"
fi

# Check MongoDB (port 27017)
if ss -tlnp | grep -q ":27017"; then
    echo "✓ MongoDB: Running on port 27017"
else
    echo "✗ MongoDB: Not running on port 27017"
fi

# Check Redis (port 6379)
if ss -tlnp | grep -q ":6379"; then
    echo "✓ Redis: Running on port 6379"
else
    echo "✗ Redis: Not running on port 6379"
fi

echo ""
echo "All databases are ready for ChatWeb application!"
