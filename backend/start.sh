#!/bin/sh
echo "Starting Thoub-AI Backend..."
echo "Port: ${PORT:-8000}"

# Execute uvicorn with explicit integer conversion for port if needed, 
# although shell expansion normally handles it. 
# We use exec to replace the shell process.
exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --log-level debug
