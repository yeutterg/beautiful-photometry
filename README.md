# Beautiful Photometry

A modern web application for photometry analysis with a React frontend and Python Flask backend.

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Project Structure

```
beautiful-photometry/
├── backend/                 # Python Flask backend
│   ├── app.py              # Main Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend container configuration
│   ├── src/                # Source code for photometry calculations
│   ├── CSVs/              # SPD data files
│   │   ├── examples/      # Pre-loaded example SPD files
│   │   └── user/          # User-uploaded SPD files
│   ├── uploads/           # Temporary upload directory
│   └── out/               # Generated output files
├── frontend/              # Next.js React frontend
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/              # Utility libraries
│   └── Dockerfile        # Frontend container configuration
├── old/                  # Legacy code and examples
├── docker-compose.yml    # Multi-container Docker configuration
├── LICENSE              # MIT License
└── README.md           # This file
```

## Features

- **Modern UI**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Library Management**: Import and organize SPD data
- **Photometric Analysis**: Calculate CRI, CCT, Rf, Rg, melanopic ratios
- **Real-time Updates**: Automatic chart refresh when parameters change
- **Multiple File Formats**: Support for CSV, XLS, TXT, and UPRtek files
- **Dark/Light Mode**: Toggle between themes
- **Export Options**: Save charts and data in various formats

## Quick Start

### Option 1: Quick Start Script (Recommended)

```bash
# Make the script executable
chmod +x quick_start.sh

# Start web interface
./quick_start.sh web

# Run CLI
./quick_start.sh cli --help

# Install dependencies
./quick_start.sh install

# Run tests
./quick_start.sh test
```

### Option 2: Docker

```bash
# Start all services
docker-compose up

# Run in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Run CLI
docker-compose --profile cli run --rm beautiful-photometry-cli --help
```

**Access URLs:**
- Frontend: http://localhost:3000
- Backend API (Flask): http://localhost:5001
- TypeScript Backend API: http://localhost:8081
- Health check endpoint: http://localhost:8081/health

**Note:** When you make code changes, you'll need to rebuild the containers with `docker-compose up --build`

### Option 3: Manual Installation

```bash
# Install the package
pip install -e .

# Start web interface
python -m beautiful_photometry web

# Run CLI
python -m beautiful_photometry cli --help
```

## Installation

### Prerequisites

- Python 3.8 or higher
- pip package manager

### Development Installation

```bash
# Clone the repository
git clone https://github.com/yeutterg/beautiful-photometry.git
cd beautiful-photometry

# Install in development mode with all dependencies
pip install -e ".[dev]"

# Install pre-commit hooks
pre-commit install
```

## Usage

### Web Interface

1. **Single SPD Analysis**:
   - Upload a CSV file
   - Configure options (normalize, melanopic curve, etc.)
   - View results and export

2. **Compare Multiple Spectra**:
   - Enter CSV data for multiple spectra
   - Set individual weights and normalization
   - Generate comparison plots

### Command Line Interface

```bash
# Analyze single spectrum
python -m beautiful_photometry cli single CSVs/incandescent.csv --normalize --melanopic-curve

# Compare multiple spectra
python -m beautiful_photometry cli compare CSVs/incandescent.csv CSVs/halogen.csv --normalize

# Batch process directory
python -m beautiful_photometry cli batch CSVs/ --normalize --output batch_comparison.png
```

## Development

### Project Structure

```
beautiful-photometry/
├── src/beautiful_photometry/    # Main package
│   ├── __init__.py
│   ├── __main__.py
│   ├── web.py                   # Flask web application
│   ├── cli.py                   # Command-line interface
│   ├── spectrum.py              # Spectrum processing
│   ├── plot.py                  # Plotting functions
│   ├── photometer.py            # Photometer support
│   ├── human_circadian.py       # Circadian calculations
│   ├── human_visual.py          # Visual calculations
│   ├── templates/               # HTML templates
│   └── static/                  # Web assets
├── tests/                       # Test suite
├── docs/                        # Documentation
├── CSVs/                        # Example data files
├── examples/                    # Jupyter notebooks
├── pyproject.toml              # Modern Python packaging
├── Makefile                    # Development tasks
├── docker-compose.yml          # Docker configuration
└── quick_start.sh              # Easy startup script
```

### Development Commands

```bash
# Show all available commands
make help

# Install in development mode
make install-dev

# Run tests
make test

# Format code
make format

# Run linting
make lint

# Run all checks
make check

# Build package
make build

# Clean build artifacts
make clean
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=beautiful_photometry --cov-report=html

# Run specific test file
pytest tests/test_spectrum.py
```

## File Formats

### Standard CSV Format

```
wavelength,intensity
380,0.048
381,0.051
382,0.054
...
```

### UPRtek Format

The tool supports UPRtek spectrophotometer files (.xls format, actually tab-delimited text).

## Metrics Explained

- **Melanopic Ratio**: Non-visual to visual response ratio
- **Melanopic Response**: Absolute melanopic luminous flux
- **Scotopic/Photopic Ratio**: Night vision to day vision ratio
- **Melanopic/Photopic Ratio**: Circadian to visual response ratio

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run `make check` to ensure code quality
6. Submit a pull request

## License

Distributed under the MIT license. See LICENSE file for details.

## Acknowledgments

- Based on the Colour Science library
- Inspired by the original Beautiful Photometry project
- Built with Flask, Bootstrap, and modern web technologies

## See Also

- [Beautiful Flicker](https://github.com/yeutterg/beautiful-flicker) - Related project for flicker analysis
