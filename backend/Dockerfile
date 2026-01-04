# Use specific Python version
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies (needed for OpenCV/MediaPipe)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
# Upgrade pip and install build tools first
RUN pip install --no-cache-dir --upgrade pip wheel setuptools

# Install numpy first as it's a heavy dependency
RUN pip install --no-cache-dir numpy

# Install remaining requirements with increased timeout
# Use --verbose to prevent silent timeouts
RUN pip install --no-cache-dir --default-timeout=100 -v -r requirements.txt

# Copy the rest of the application
COPY . .

# Expose port (Railway fills $PORT env var)
ENV PORT=8000
EXPOSE $PORT

# Run the application
COPY start.sh .
RUN chmod +x start.sh

CMD ["./start.sh"]
