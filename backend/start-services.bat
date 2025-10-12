@echo off
echo Starting Vedda Translator Microservices...

echo 1. Starting Dictionary Service...
start "Dictionary Service" cmd /k "cd dictionary-service && python app.py"
timeout /t 3

echo 2. Starting History Service...
start "History Service" cmd /k "cd history-service && python app.py"
timeout /t 3

echo 3. Starting Translator Service...
start "Translator Service" cmd /k "cd translator-service && python app.py"
timeout /t 3

echo 4. Starting API Gateway...
start "API Gateway" cmd /k "cd api-gateway && python app.py"

echo.
echo All services started!
echo - Dictionary Service: http://localhost:5002
echo - History Service: http://localhost:5003
echo - Translator Service: http://localhost:5001
echo - API Gateway: http://localhost:5000
echo.
echo Main Application URL: http://localhost:5000
echo.
echo To stop services, close the individual terminal windows or run stop-services.bat
pause