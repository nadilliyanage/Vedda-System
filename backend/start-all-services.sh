#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Starting Vedda System Backend Services..."
echo ""

# Kill any existing processes to avoid port conflicts
echo "Stopping existing processes on ports 5000-5011..."
lsof -ti:5000,5001,5002,5003,5005,5006,5008,5010,5011 | xargs kill -9 2>/dev/null
sleep 2

echo ""
echo "Starting services in order..."

# Start API Gateway (Port 5000)
echo "Starting API Gateway on port 5000..."
if [ -d "$SCRIPT_DIR/api-gateway" ]; then
  cd "$SCRIPT_DIR/api-gateway" && python3 app.py > "$SCRIPT_DIR/logs/api-gateway.log" 2>&1 &
  sleep 3
fi

# Start Translator Service (Port 5001)
echo "Starting Translator Service on port 5001..."
if [ -d "$SCRIPT_DIR/translator-service" ]; then
  cd "$SCRIPT_DIR/translator-service" && python3 run.py > "$SCRIPT_DIR/logs/translator.log" 2>&1 &
  sleep 3
fi

# Start Dictionary Service (Port 5002)
echo "Starting Dictionary Service on port 5002..."
if [ -d "$SCRIPT_DIR/dictionary-service" ]; then
  cd "$SCRIPT_DIR/dictionary-service" && python3 run.py > "$SCRIPT_DIR/logs/dictionary.log" 2>&1 &
  sleep 3
fi

# Start History Service (Port 5003)
echo "Starting History Service on port 5003..."
if [ -d "$SCRIPT_DIR/history-service" ]; then
  cd "$SCRIPT_DIR/history-service" && python3 run.py > "$SCRIPT_DIR/logs/history.log" 2>&1 &
  sleep 3
fi

# Start Auth Service (Port 5005)
echo "Starting Auth Service on port 5005..."
if [ -d "$SCRIPT_DIR/auth-service" ]; then
  cd "$SCRIPT_DIR/auth-service"
  PORT=5005 npm start > "$SCRIPT_DIR/logs/auth.log" 2>&1 &
  sleep 3
fi

# Start Learn Service (Port 5006)
echo "Starting Learn Service on port 5006..."
if [ -d "$SCRIPT_DIR/learn-service" ]; then
  cd "$SCRIPT_DIR/learn-service" && python3 run.py > "$SCRIPT_DIR/logs/learn.log" 2>&1 &
  sleep 3
fi

# Start 3D Model Service (Port 5008)
echo "Starting 3D Model Service on port 5008..."
if [ -d "$SCRIPT_DIR/3D-model-service" ]; then
  cd "$SCRIPT_DIR/3D-model-service" && python3 run.py > "$SCRIPT_DIR/logs/3d-model.log" 2>&1 &
  sleep 3
fi

# Start Artifact Service (Port 5010)
echo "Starting Artifact Service on port 5010..."
if [ -d "$SCRIPT_DIR/artifact-service" ]; then
  cd "$SCRIPT_DIR/artifact-service" && npm run dev > "$SCRIPT_DIR/logs/artifact.log" 2>&1 &
fi


echo ""
echo "All backend services started successfully!"
echo ""
echo "Services running on:"
echo "- API Gateway: http://localhost:5000"
echo "- Translator Service: http://localhost:5001"
echo "- Dictionary Service: http://localhost:5002"
echo "- History Service: http://localhost:5003"
echo "- Auth Service: http://localhost:5005"
echo "- Learn Service: http://localhost:5006"
echo "- 3D Model Service: http://localhost:5008"
echo "- Artifact Service: http://localhost:5010"
echo ""
echo "Logs are available in the 'logs' directory"
echo ""
echo "To start the frontend, run: npm run dev (in the frontend directory)"
echo "Frontend will be available at: http://localhost:5173"
echo ""
echo "To stop all services, run: ./stop-all-services.sh"
