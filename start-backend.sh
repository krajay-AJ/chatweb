
#!/bin/bash

# Always run the backend from /server with npx ts-node src/index.ts or npm run dev

cd "$(dirname "$0")/server" || { echo "Failed to cd to /server"; exit 1; }

# Kill any running backend processes (ts-node, nodemon, or node on src/index.ts)
PIDS=$(pgrep -f "(ts-node|nodemon|node).*src/index.ts")
if [ -n "$PIDS" ]; then
  echo "Killing running backend processes: $PIDS"
  kill $PIDS
  sleep 2
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Start backend with npx ts-node src/index.ts
echo "Starting backend with: npx ts-node src/index.ts"
npx ts-node src/index.ts
