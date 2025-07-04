#!/bin/bash

# Beautiful Photometry Quick Start Script

set -e

echo "Beautiful Photometry - Quick Start"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Docker is available
check_docker() {
    if command_exists docker; then
        echo "✓ Docker found"
        return 0
    else
        echo "✗ Docker not found"
        return 1
    fi
}

# Function to check if Python dependencies are available
check_python_deps() {
    python3 -c "import colour, matplotlib, flask" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✓ Python dependencies found"
        return 0
    else
        echo "✗ Python dependencies not found"
        return 1
    fi
}

# Function to install Python dependencies
install_python_deps() {
    echo "Installing Python dependencies..."
    pip3 install -r requirements.txt
}

# Function to start web interface with Python
start_web_python() {
    echo "Starting web interface with Python..."
    echo "The web interface will be available at http://localhost:8765"
    echo "You can specify a different port with: --port PORT"
    echo "You can specify a different host with: --host HOST"
    echo "You can disable debug mode with: --no-debug"
    echo ""
    echo "Examples:"
    echo "  Default: python3 -m src.beautiful_photometry web"
    echo "  Custom port: python3 -m src.beautiful_photometry web --port 9000"
    echo "  Local only: python3 -m src.beautiful_photometry web --host 127.0.0.1"
    echo "  Production: python3 -m src.beautiful_photometry web --port 9000 --no-debug"
    echo ""
    python3 -m src.beautiful_photometry web
}

# Function to start web interface with Docker
start_web_docker() {
    echo "Starting web interface with Docker..."
    docker-compose up --build
}

# Function to run CLI with Python
run_cli_python() {
    echo "Running CLI with Python..."
    python3 -m src.beautiful_photometry cli "$@"
}

# Function to run CLI with Docker
run_cli_docker() {
    echo "Running CLI with Docker..."
    docker-compose --profile cli run --rm beautiful-photometry-cli "$@"
}

# Main script logic
case "${1:-web}" in
    "web")
        echo "Starting web interface..."
        if check_python_deps; then
            start_web_python
        elif check_docker; then
            start_web_docker
        else
            echo "Error: Neither Python dependencies nor Docker are available."
            echo "Please install dependencies: pip3 install -r requirements.txt"
            echo "Or install Docker and try again."
            exit 1
        fi
        ;;
    "cli")
        shift
        if check_python_deps; then
            run_cli_python "$@"
        elif check_docker; then
            run_cli_docker "$@"
        else
            echo "Error: Neither Python dependencies nor Docker are available."
            echo "Please install dependencies: pip3 install -r requirements.txt"
            echo "Or install Docker and try again."
            exit 1
        fi
        ;;
    "install")
        echo "Installing Python dependencies..."
        install_python_deps
        echo "Installation complete!"
        ;;
    "test")
        echo "Running basic tests..."
        python3 test_basic.py
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command] [options]"
        echo ""
        echo "Commands:"
        echo "  web                    Start web interface (default)"
        echo "  cli [options]          Run command-line interface"
        echo "  install                Install Python dependencies"
        echo "  test                   Run basic functionality tests"
        echo "  help                   Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 web                 # Start web interface"
        echo "  $0 cli --help          # Show CLI help"
        echo "  $0 cli single CSVs/incandescent.csv --normalize"
        echo "  $0 web --port 9000                    # Start on custom port"
        echo "  $0 install             # Install dependencies"
        echo "  $0 test                # Run tests"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac 