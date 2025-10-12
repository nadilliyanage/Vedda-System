#!/bin/bash

# Vedda Translator - Start All Services
echo "Starting Vedda Translator Microservices..."

# Start services in the correct order
echo "1. Starting Dictionary Service..."
cd dictionary-service
python app.py &
DICT_PID=$!
cd ..

echo "2. Starting History Service..."
cd history-service
python app.py &
HIST_PID=$!
cd ..

echo "3. Starting Translator Service..."
cd translator-service
python app.py &
TRANS_PID=$!
cd ..

echo "4. Starting API Gateway..."
cd api-gateway
python app.py &
GATEWAY_PID=$!
cd ..

echo ""
echo "All services started!"
echo "- Dictionary Service: http://localhost:5002"
echo "- History Service: http://localhost:5003"
echo "- Translator Service: http://localhost:5001"
echo "- API Gateway: http://localhost:5000"
echo ""
echo "Main Application URL: http://localhost:5000"
echo ""
echo "To stop all services, run: ./stop-services.sh"

# Save PIDs for cleanup
echo "$DICT_PID $HIST_PID $TRANS_PID $GATEWAY_PID" > .service_pids

# Wait for user input to stop
echo "Press Ctrl+C to stop all services..."
wait