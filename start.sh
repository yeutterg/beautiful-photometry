#!/bin/bash
if [ "$1" = "web" ]; then
    echo "Starting Beautiful Photometry Web Interface..."
    python app.py
elif [ "$1" = "cli" ]; then
    echo "Beautiful Photometry CLI"
    python cli.py "${@:2}"
else
    echo "Usage:"
    echo "  docker run -p 8080:8080 beautiful-photometry web    # Start web interface"
    echo "  docker run beautiful-photometry cli --help          # Show CLI help"
    echo "  docker run -v \$(pwd)/data:/app/data beautiful-photometry cli single data/spectrum.csv"
fi