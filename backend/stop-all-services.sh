#!/bin/bash

echo "Stopping Vedda System Backend Services..."
echo ""

# Kill processes on all service ports
echo "Stopping services on ports 5000, 5001, 5002, 5003, 5005, 5006, 5007, 5008, 5009, 5010, 5011..."
lsof -ti:5000,5001,5002,5003,5005,5006,5007,5008,5009,5010,5011 | xargs kill -9 2>/dev/null

echo ""
echo "All backend services stopped!"
