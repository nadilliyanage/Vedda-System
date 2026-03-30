# Speech Service Dockerfile (Multi-stage for size optimization)
# Uses fine-tuned Whisper model for Vedda ASR (76.06% accuracy)
FROM python:3.9-slim as builder

WORKDIR /tmp/build

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies to temporary location
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt && \
    pip install --user --no-cache-dir torch==2.0.0 --index-url https://download.pytorch.org/whl/cpu

# Final runtime stage (smaller base)
FROM python:3.9-slim

WORKDIR /app

# Install only runtime dependencies (no build-essential)
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built Python packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Health check - verify service is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5007/health', timeout=5)" || exit 1

EXPOSE 5007

# Run the service with Python unbuffered output
CMD ["python", "-u", "run.py"]
