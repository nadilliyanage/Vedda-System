@echo off
cd /d "d:\SLIIT\RP\Vedda System\backend\speech-service"

echo [WAIT] Waiting for v4 training to finish...
:wait_loop
timeout /t 60 /nobreak >nul
if not exist "vedda-asr-model\models\whisper-frozen-v4\final\model.safetensors" goto wait_loop

echo [RUN] v4 training done - running inference...
python test_frozen_model_v3.py

echo [RUN] Verifying accuracy...
python verify_accuracy.py

echo [RUN] Analysing predictions...
python analyze_report.py

echo [DONE] All done.
pause
