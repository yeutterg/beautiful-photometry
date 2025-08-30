# Beautiful Photometry

A modern web application for analyzing the spectral and temporal components of lighting. Generates charts and calculates metrics, including color rendering index, TM-30, and circadian input.

The frontend is built in Next.js. There are two backends: a Python backend that incorporates a legacy chart generation tool, and a TypeScript/Express backend that will generate charts and metrics going forward.  

This project is packaged in Docker for relative ease of setup and portability. It is constantly evolving as needs arise.

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.2 with App Router
- **UI Library**: React 19.1.0
- **Component Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS 4.0
- **State Management**: Zustand 5.0
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts 2.15
- **Theme**: next-themes for dark/light mode
- **Export**: html2canvas for image generation

### Backend Services
- **Python Backend**: Flask with Python 3.12+
  - Photometry calculations
  - Legacy chart generation
  - File processing and conversion
- **TypeScript Backend**: Express 5 with TypeScript 5.9
  - High-performance metrics calculations
  - CRI and TM-30 algorithms
  - RESTful API endpoints

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Development**: Hot reload with Nodemon (backend) and Next.js Fast Refresh (frontend)

## Architecture

Beautiful Photometry uses a microservices architecture with three main components:

1. **Frontend (Next.js 15)**: Modern React application with shadcn/ui components for user interface
2. **Python Backend (Flask)**: Handles legacy chart generation, file processing, and established photometry algorithms
3. **TypeScript Backend (Express)**: Provides high-performance metrics calculations with type safety

## Project Structure

```
beautiful-photometry/
├── frontend/                    # Next.js 15 React frontend
│   ├── app/                    # App router pages
│   │   ├── cri/               # CRI analysis page
│   │   ├── flicker/           # Temporal/flicker analysis
│   │   ├── library/           # SPD library management
│   │   ├── spd/               # SPD visualization
│   │   └── tm30/              # TM-30 metrics
│   ├── components/            # React components
│   │   ├── cri/              # CRI-specific components
│   │   ├── layout/           # Layout components (sidebar, etc.)
│   │   ├── library/          # Library management components
│   │   ├── photometrics/     # Photometric display components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utilities and stores
│   ├── package.json          # Frontend dependencies
│   └── Dockerfile            # Frontend container config
├── backend/                   # Python Flask backend
│   ├── app.py                # Main Flask application
│   ├── src/                  # Python photometry calculations
│   ├── CSVs/                 # SPD data files
│   │   ├── examples/         # Pre-loaded example SPDs
│   │   └── user/             # User-uploaded SPDs
│   ├── uploads/              # Temporary upload directory
│   ├── out/                  # Generated output files
│   └── Dockerfile            # Backend container config
├── ts-backend/               # TypeScript Express backend
│   ├── src/                  # TypeScript source
│   │   ├── calculations/     # Metrics calculation modules
│   │   ├── data/            # Reference data
│   │   ├── types/           # TypeScript type definitions
│   │   └── index.ts         # Main server file
│   ├── package.json         # Backend dependencies
│   └── Dockerfile           # TS backend container config
├── docker-compose.yml       # Multi-container orchestration
├── quick_start.sh          # Quick start script
├── Makefile                # Development commands
└── README.md              # This file
```

## Features

### Core Capabilities
- **SPD Library Management**: Import, organize, and manage spectral power distribution data
- **Multi-SPD Analysis**: Compare multiple light sources simultaneously
- **Real-time Visualization**: Interactive charts with Recharts library
- **Dark/Light Mode**: Full theme support with next-themes
- **Export Functionality**: Export charts and tables as high-resolution PNG images

### Photometric Analysis
- **CRI Analysis**: 
  - Color Rendering Index (Ra) calculation
  - Individual R1-R15 values display
  - Interactive bar charts and detailed tables
  - Multi-source comparison
- **TM-30 Metrics**: 
  - Fidelity Index (Rf) and Gamut Index (Rg)
  - Color vector graphics
  - Hue angle analysis
- **SPD Visualization**:
  - Spectral power distribution plots
  - Wavelength range: 380-780nm
  - Normalized and absolute intensity modes
- **Circadian Metrics**:
  - Melanopic ratios and responses
  - Scotopic/Photopic ratios
  - Circadian stimulus calculations

### Temporal Analysis
- **Flicker Metrics**: 
  - Percent flicker calculation
  - Flicker index
  - Frequency analysis
  - Temporal light artifacts

### File Format Support
- Standard CSV format (wavelength, intensity)
- UPRtek spectrophotometer files (.xls)
- Tab-delimited text files
- Batch import capabilities

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

### Access URLs
- **Frontend**: http://localhost:3000
- **Python Backend API**: http://localhost:5001
- **TypeScript Backend API**: http://localhost:8081
- **Health Check**: http://localhost:8081/health

### API Endpoints

#### TypeScript Backend (Port 8081)
- `GET /health` - Health check endpoint
- `POST /api/cri` - Calculate CRI values for SPD data
- `POST /api/tm30` - Calculate TM-30 metrics
- `POST /api/metrics` - Calculate comprehensive photometric metrics

#### Python Backend (Port 5001)
- `POST /api/upload` - Upload SPD files
- `POST /api/analyze` - Analyze SPD data
- `GET /api/library` - Get SPD library
- `POST /api/export` - Export charts and data

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

### Prerequisites
- Docker and Docker Compose (recommended)
- OR Node.js 18+ and Python 3.12+ for local development

### Development Setup

#### Using Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/yeutterg/beautiful-photometry.git
cd beautiful-photometry

# Start all services with hot reload
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f [service-name]

# Rebuild after dependency changes
docker-compose up --build
```

#### Local Development
```bash
# Frontend development
cd frontend
npm install
npm run dev  # Starts on http://localhost:3000

# TypeScript backend
cd ts-backend
npm install
npm run dev  # Starts on http://localhost:8081

# Python backend
cd backend
pip install -r requirements.txt
python app.py  # Starts on http://localhost:5001
```

### Development Commands

#### Frontend Commands
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run lint     # Run ESLint
npm run start    # Start production server
```

#### TypeScript Backend Commands
```bash
cd ts-backend
npm run dev      # Start with hot reload
npm run build    # Compile TypeScript
npm run start    # Run compiled JavaScript
```

#### Docker Commands
```bash
# Start specific service
docker-compose up [frontend|backend|ts-backend]

# Run commands in container
docker-compose exec frontend npm run lint
docker-compose exec ts-backend npm test

# Clean up
docker-compose down -v  # Remove containers and volumes
```

### Environment Variables

#### Frontend
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001       # Python backend URL
NEXT_PUBLIC_TS_API_URL=http://localhost:8081    # TypeScript backend URL
```

#### Python Backend
```bash
FLASK_ENV=development                           # Flask environment
FLASK_DEBUG=1                                   # Enable debug mode
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=beautiful_photometry --cov-report=html

# Run specific test file
pytest tests/test_spectrum.py

# Frontend tests (when available)
cd frontend && npm test

# TypeScript backend tests (when available)
cd ts-backend && npm test
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

## See Also

- [Beautiful Flicker](https://github.com/yeutterg/beautiful-flicker) - Related project for flicker analysis
