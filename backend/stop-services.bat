@echo off
echo Stopping all Vedda Translator services...

echo Stopping Dictionary Service (Port 5002)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5002"') do taskkill /f /pid %%a 2>nul

echo Stopping History Service (Port 5003)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5003"') do taskkill /f /pid %%a 2>nul

echo Stopping Translator Service (Port 5001)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001"') do taskkill /f /pid %%a 2>nul

echo Stopping API Gateway (Port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000"') do taskkill /f /pid %%a 2>nul

echo All services stopped!
pause