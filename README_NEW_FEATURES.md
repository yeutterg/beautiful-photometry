# Beautiful Photometry - New Features & Improvements

This document summarizes the new features and improvements added to the Beautiful Photometry project.

## 🎉 New Features

### 1. Web Interface
- **Modern Flask-based web application** with responsive Bootstrap UI
- **File upload support** for CSV, XLS, and TXT files
- **Direct CSV data entry** for quick spectrum input
- **Real-time plot generation** with interactive controls
- **Export functionality** in PNG, SVG, and PDF formats
- **Metrics display** showing melanopic ratios, responses, and photopic ratios

### 2. Modernized Command Line Interface
- **Subcommand structure** (`single`, `compare`, `batch`) for better organization
- **Comprehensive argument parsing** with validation
- **Global options** for consistent behavior across commands
- **Better error handling** and user feedback
- **Help system** with examples and usage information

### 3. Enhanced Plotting Controls
- **Line color and style** customization
- **Text size and font** control
- **Title customization** for all plots
- **Legend positioning** (upper-left, upper-right, lower-left, lower-right, center)
- **Y-axis visibility** toggle
- **Figure size** control

### 4. Export Options
- **PNG format** for high-resolution raster images
- **SVG format** for scalable vector graphics
- **PDF format** for print-quality output
- **300 DPI resolution** for publication-quality images

## 🔧 Technical Improvements

### 1. Code Quality
- **Fixed syntax warnings** (replaced `is not` with `!=` for literals)
- **Type hints** and documentation
- **Error handling** throughout the application
- **Modular architecture** with clear separation of concerns

### 2. Installation & Deployment
- **Docker support** with multi-stage builds
- **Docker Compose** for easy deployment
- **Setup.py** for package installation
- **Quick start script** for easy usage
- **Requirements management** with proper dependency specification

### 3. User Experience
- **Responsive web design** that works on desktop and mobile
- **Loading indicators** and progress feedback
- **Error messages** with helpful suggestions
- **Auto-completion** of SPD names from filenames
- **Tabbed interface** for different operations

## 📁 New File Structure

```
beautiful-photometry/
├── app.py                 # Flask web application
├── cli.py                 # Modernized command-line interface
├── setup.py               # Package installation script
├── requirements.txt       # Python dependencies
├── Dockerfile             # Docker container definition
├── docker-compose.yml     # Docker Compose configuration
├── quick_start.sh         # Easy startup script
├── test_basic.py          # Basic functionality tests
├── README_WEB.md          # Comprehensive documentation
├── README_NEW_FEATURES.md # This file
├── templates/             # HTML templates
│   └── index.html
├── static/                # Web assets
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── uploads/               # Temporary file uploads
└── src/                   # Core photometry modules (unchanged)
    ├── spectrum.py
    ├── plot.py
    ├── photometer.py
    ├── human_circadian.py
    └── human_visual.py
```

## 🚀 Getting Started

### Option 1: Quick Start (Recommended)
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
# Start web interface
docker-compose up

# Run CLI
docker-compose --profile cli run --rm beautiful-photometry-cli --help
```

### Option 3: Manual Installation
```bash
# Install dependencies
pip install -r requirements.txt

# Start web interface
python app.py

# Run CLI
python cli.py --help
```

## 📊 Usage Examples

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
python cli.py single CSVs/incandescent.csv --normalize --melanopic-curve

# Compare multiple spectra
python cli.py compare CSVs/incandescent.csv CSVs/halogen.csv --normalize

# Batch process directory
python cli.py batch CSVs/ --normalize --output batch_comparison.png
```

## 🔍 Key Metrics Available

- **Melanopic Ratio**: Non-visual to visual response ratio
- **Melanopic Response**: Absolute melanopic luminous flux
- **Scotopic/Photopic Ratio**: Night vision to day vision ratio
- **Melanopic/Photopic Ratio**: Circadian to visual response ratio

## 🎨 Plot Customization

### Web Interface Controls
- **Melanopic Curve**: Show/hide sensitivity curve
- **Melanopic Stimulus**: Show/hide stimulus overlay
- **Hide Y-Axis**: Cleaner appearance
- **Legend Position**: Choose from 5 positions
- **Title**: Custom plot titles

### CLI Options
- `--melanopic-curve`: Show melanopic sensitivity curve
- `--melanopic-stimulus`: Show melanopic stimulus
- `--hide-yaxis`: Hide Y-axis
- `--legend-location`: Set legend position
- `--title`: Custom plot title
- `--figsize`: Control figure dimensions

## 🔧 Advanced Features

### File Format Support
- **Standard CSV**: wavelength,intensity format
- **UPRtek files**: Native spectrophotometer format
- **Batch processing**: Process entire directories

### Export Quality
- **High resolution**: 300 DPI output
- **Vector formats**: SVG and PDF for scaling
- **Print ready**: Publication-quality graphics

### Error Handling
- **File validation**: Check file existence and format
- **Data validation**: Verify CSV format and data integrity
- **User feedback**: Clear error messages and suggestions

## 🐛 Troubleshooting

### Common Issues
1. **Dependencies not installed**: Use `./quick_start.sh install`
2. **File format errors**: Check CSV format (wavelength,intensity)
3. **Port conflicts**: Change port in `app.py` or Docker configuration
4. **Memory issues**: Process fewer files for large datasets

### Getting Help
- **Web interface**: Built-in error messages and validation
- **CLI**: Use `--help` for command documentation
- **Quick start**: Use `./quick_start.sh help`

## 🔮 Future Enhancements

Potential areas for future development:
- **Database integration** for storing and retrieving spectra
- **Advanced plotting options** (3D plots, heatmaps)
- **API endpoints** for programmatic access
- **User authentication** for multi-user environments
- **Cloud deployment** options
- **Mobile app** for field measurements

## 📝 Migration from Original

The original functionality is fully preserved:
- All existing functions work as before
- Jupyter notebooks continue to work
- File formats remain compatible
- Core photometry calculations unchanged

New features are additive and don't break existing workflows.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

Distributed under the MIT license. See LICENSE file for details. 