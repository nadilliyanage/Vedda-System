@echo off
echo Starting Vedda System Backend Services...
echo.

REM Kill any existing processes to avoid port conflicts
echo Stopping existing processes...
taskkill /f /im python.exe 2>nul
@REM taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting services in order...

REM Start Dictionary Service (Port 5002)
echo Starting Dictionary Service on port 5002...
start "Dictionary Service" cmd /k "cd /d "%~dp0dictionary-service" && python app.py"
timeout /t 3 /nobreak >nul

REM Start History Service (Port 5003) 
echo Starting History Service on port 5003...
start "History Service" cmd /k "cd /d "%~dp0history-service" && python app.py"
timeout /t 3 /nobreak >nul

REM Start Translator Service (Port 5001)
echo Starting Translator Service on port 5001...
start "Translator Service" cmd /k "cd /d "%~dp0translator-service" && python app.py"
timeout /t 3 /nobreak >nul

REM Start API Gateway (Port 5000)
echo Starting API Gateway on port 5000...
start "API Gateway" cmd /k "cd /d "%~dp0api-gateway" && python app.py"
timeout /t 3 /nobreak >nul

REM Start Auth-service (Port 5011)
echo Starting Auth Service on port 5011...
start "Auth Service" cmd /k "cd /d "%~dp0auth-service" && npm i && npm start"
timeout /t 3 /nobreak >nul

REM Start Learn Service (Port 5006)
echo Starting Learn Service on port 5006...
start "Learn Service" cmd /k "cd /d "%~dp0learn-service" && python app.py"
timeout /t 3 /nobreak >nul

REM Start Artifact Service (Port 5010)
echo Starting Artifact Service on port 5010...
start "Artifact Service" cmd /k "cd /d "%~dp0artifact-service" && npm i && npm start"

echo.
echo All backend services started successfully!
echo.
echo Services running on:
echo - API Gateway: http://localhost:5000
echo - Translator Service: http://localhost:5001  
echo - Dictionary Service: http://localhost:5002
echo - History Service: http://localhost:5003
echo - Auth Service: http://localhost:5011
echo - Artifact Service: http://localhost:5010
echo.
echo To start the frontend, run: npm run dev (in the frontend directory)
echo Frontend will be available at: http://localhost:5173
echo.
pause