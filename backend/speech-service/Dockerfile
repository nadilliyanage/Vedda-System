# Speech Service Dockerfile
# Uses fine-tuned Whisper model for Vedda ASR (68% accuracy)
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies for audio processing and build tools
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies (torch CPU only, not GPU)
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir torch==2.0.0 --index-url https://download.pytorch.org/whl/cpu

# Copy application code
COPY . .

# Health check - verify service is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5007/health', timeout=5)" || exit 1

EXPOSE 5007

# Run the service with Python unbuffered output
CMD ["python", "-u", "run.py"]
