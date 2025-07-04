# Python version: latest stable Python 3 slim
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Expose port for web interface
EXPOSE 5000

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Create a startup script
RUN echo '#!/bin/bash\n\
if [ "$1" = "web" ]; then\n\
    echo "Starting Beautiful Photometry Web Interface..."\n\
    python app.py\n\
elif [ "$1" = "cli" ]; then\n\
    echo "Beautiful Photometry CLI"\n\
    python cli.py "${@:2}"\n\
else\n\
    echo "Usage:"\n\
    echo "  docker run -p 5000:5000 beautiful-photometry web    # Start web interface"\n\
    echo "  docker run beautiful-photometry cli --help          # Show CLI help"\n\
    echo "  docker run -v \$(pwd)/data:/app/data beautiful-photometry cli single data/spectrum.csv\n\
fi' > /app/start.sh && chmod +x /app/start.sh

# Set the entrypoint
ENTRYPOINT ["/app/start.sh"]

# Default to web interface
CMD ["web"]