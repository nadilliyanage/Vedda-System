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

echo Starting Translator Service on port 5001...
cd "%~dp0translator-service"
echo Installing requirements...
pip install -r requirements.txt > nul 2>&1
start "Translator Service" python run.py
cd ..
timeout /t 3 > nul

echo Starting Dictionary Service on port 5002...
cd "%~dp0dictionary-service"
echo Installing requirements...
pip install -r requirements.txt > nul 2>&1
start "Dictionary Service" python run.py
cd ..
timeout /t 2 > nul

echo Starting History Service on port 5003...
cd "%~dp0history-service"
echo Installing requirements...
pip install -r requirements.txt > nul 2>&1
start "History Service" python run.py
cd ..
timeout /t 2 > nul

REM Start Auth-service (Port 5005)
echo Starting Auth Service on port 5005...
start "Auth Service" cmd /k "cd /d "%~dp0auth-service" && npm i && npm start"
timeout /t 3 /nobreak >nul

echo Starting Learn Service on port 5006...
cd "%~dp0learn-service"
echo Installing requirements...
pip install -r requirements.txt > nul 2>&1
start "Learn Service" python run.py
cd ..
timeout /t 2 > nul

echo Starting Speech Service on port 5007...
cd "%~dp0speech-service"
echo Installing requirements...
pip install -r requirements.txt > nul 2>&1
start "Speech Service" python run.py
cd ..
timeout /t 3 > nul

echo starring 3D Model Service on port 5008...
cd "%~dp03D-model-service"
echo Installing requirements...
pip install -r requirements.txt > nul 2>&1
start "3D Model Service" python run.py
cd ..
timeout /t 2 > nul

REM Start Artifact-service (Port 5010)
echo Starting Artifact Service on port 5010...
start "Artifact Service" cmd /k "cd /d "%~dp0artifact-service" && npm i && npm start"
timeout /t 3 /nobreak >nul

echo Starting API Gateway on port 5000...
cd "%~dp0api-gateway"
echo Installing requirements...
pip install -r requirements.txt > nul 2>&1
start "API Gateway" python app.py
cd ..
timeout /t 2 > nul

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
echo - 3D Model Service: http://localhost:5008
echo - Artifact Service: http://localhost:5010
echo.
echo To start the frontend, run: npm run dev (in the frontend directory)
echo Frontend will be available at: http://localhost:5173
echo.
pause