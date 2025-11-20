@echo off
echo Starting All Vedda System Services...
echo.

echo Stopping existing processes...
taskkill /f /im python.exe > nul 2>&1
taskkill /f /im node.exe > nul 2>&1

echo.
echo Creating logs directory...
if not exist logs mkdir logs

echo Starting services in order...

echo Starting Dictionary Service (MongoDB) on port 5002...
cd "%~dp0dictionary-service"
start "Dictionary Service" python app.py
cd ..
timeout /t 2 > nul

echo Starting History Service (MongoDB) on port 5003...
cd "%~dp0history-service"
start "History Service" python app.py
cd ..
timeout /t 2 > nul

echo Starting Translator Service on port 5001...
cd "%~dp0translator-service"
start "Translator Service" python app.py
cd ..
timeout /t 3 > nul

echo Starting API Gateway on port 5000...
cd "%~dp0api-gateway"
start "API Gateway" python app.py
cd ..
timeout /t 2 > nul

REM Start Auth-service (Port 5005)
echo Starting Auth Service on port 5005...
start "Auth Service" cmd /k "cd /d "%~dp0auth-service" && npm i && npm start"
timeout /t 3 /nobreak >nul

echo Starting Learn Service on port 5006...
cd "%~dp0learn-service"
start "Learn Service" python app.py
cd ..
timeout /t 2 > nul

echo Starting Speech Service on port 5007...
cd "%~dp0speech-service"
start "Speech Service" python app.py
cd ..
timeout /t 3 > nul

echo.
echo All backend services started successfully!
echo.
echo Services running on:
echo - API Gateway: http://localhost:5000
echo - Translator Service: http://localhost:5001  
echo - Dictionary Service: http://localhost:5002
echo - History Service: http://localhost:5003
echo - Auth Service: http://localhost:5005
echo - Learn Service: http://localhost:5006
echo - TTS/Speech Service: http://localhost:5007
echo - Artifact Service: http://localhost:5010
echo.
echo To start the frontend, run: npm run dev (in the frontend directory)
echo Frontend will be available at: http://localhost:5173
echo.
pause