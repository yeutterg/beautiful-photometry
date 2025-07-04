# Beautiful Photometry - Web Interface & Modern CLI

A comprehensive tool for analyzing and visualizing spectral power distributions (SPDs) with both a modern web interface and command-line interface.

## Features

- **Web Interface**: Upload SPD files or enter CSV data directly
- **Command Line Interface**: Modernized CLI with subcommands for different operations
- **Multiple File Formats**: Support for CSV, XLS, and TXT files
- **Photometer Support**: Built-in support for UPRtek spectrophotometers
- **Advanced Plotting**: Control line colors, styles, text size, fonts, titles, and legend positions
- **Export Options**: Save plots in PNG, SVG, and PDF formats
- **Metrics Calculation**: Melanopic ratios, responses, and photopic ratios
- **Batch Processing**: Process entire directories of SPD files

## Installation

### Prerequisites

- Python 3.7 or higher
- pip package manager

### Install Dependencies

```bash
pip install -r requirements.txt
```

## Web Interface

### Starting the Web Server

```bash
python app.py
```

The web interface will be available at `http://localhost:5000`

### Using the Web Interface

#### Single SPD Analysis

1. **Upload File**: Select an SPD file (CSV, XLS, or TXT format)
2. **Configure Options**:
   - **SPD Name**: Custom name for the spectrum
   - **Weight**: Multiplier for the spectral data
   - **Photometer Type**: Select if using UPRtek or standard CSV
   - **Normalize**: Normalize the SPD to [0,1] range
   - **Melanopic Curve**: Show melanopic sensitivity curve
   - **Melanopic Stimulus**: Show melanopic stimulus overlay
   - **Hide Y-Axis**: Remove Y-axis for cleaner plots

3. **Process**: Click "Process SPD" to analyze and visualize

#### Compare Multiple Spectra

1. **Enter CSV Data**: Paste wavelength,intensity pairs for each spectrum
2. **Configure Each Spectrum**:
   - **Name**: Descriptive name for each spectrum
   - **Weight**: Individual weight multiplier
   - **Normalize**: Normalize each spectrum individually

3. **Plot Options**:
   - **Title**: Custom plot title
   - **Melanopic Curve**: Show sensitivity curve
   - **Hide Y-Axis**: Cleaner appearance
   - **Show Legend**: Display spectrum names
   - **Legend Location**: Choose legend position

4. **Compare**: Click "Compare Spectra" to generate comparison plot

#### Export Options

- **PNG**: High-resolution raster format
- **SVG**: Scalable vector format
- **PDF**: Print-quality vector format

## Command Line Interface

### Basic Usage

```bash
python cli.py [command] [options]
```

### Commands

#### Single SPD Analysis

```bash
python cli.py single <file> [options]
```

**Examples:**
```bash
# Basic analysis
python cli.py single CSVs/incandescent.csv

# With normalization and melanopic curve
python cli.py single CSVs/incandescent.csv --normalize --melanopic-curve

# Save to file with custom title
python cli.py single CSVs/incandescent.csv --output incandescent.png --title "Incandescent Light"

# UPRtek file
python cli.py single data.xls --photometer uprtek --name "My Light"
```

**Options:**
- `--name`: Custom name for the SPD
- `--weight`: Weight multiplier (default: 1.0)
- `--normalize`: Normalize SPD to [0,1]
- `--melanopic-curve`: Show melanopic sensitivity curve
- `--melanopic-stimulus`: Show melanopic stimulus
- `--hide-yaxis`: Hide Y-axis
- `--output`: Save plot to file
- `--title`: Plot title
- `--no-show`: Don't display plot (save only)

#### Compare Multiple Spectra

```bash
python cli.py compare <file1> <file2> [file3...] [options]
```

**Examples:**
```bash
# Compare two spectra
python cli.py compare CSVs/incandescent.csv CSVs/halogen.csv

# With normalization and legend
python cli.py compare CSVs/incandescent.csv CSVs/halogen.csv --normalize --show-legend

# Custom legend location
python cli.py compare CSVs/incandescent.csv CSVs/halogen.csv --legend-location upper-right
```

**Options:**
- `--normalize`: Normalize all SPDs
- `--melanopic-curve`: Show melanopic curve
- `--hide-yaxis`: Hide Y-axis
- `--show-legend`: Show legend (default: True)
- `--legend-location`: Legend position (upper-left, upper-right, lower-left, lower-right, center)

#### Batch Processing

```bash
python cli.py batch <directory> [options]
```

**Examples:**
```bash
# Process all files in directory
python cli.py batch CSVs/

# With normalization and output
python cli.py batch CSVs/ --normalize --output batch_comparison.png

# Verbose output
python cli.py batch CSVs/ --verbose
```

**Options:**
- `--normalize`: Normalize all SPDs
- `--melanopic-curve`: Show melanopic curve
- `--hide-yaxis`: Hide Y-axis
- `--show-legend`: Show legend
- `--legend-location`: Legend position
- `--verbose`: Show imported file names

### Global Options

All commands support these global options:

- `--photometer`: Photometer type (none, uprtek)
- `--figsize`: Figure size in inches (width height)
- `--output`: Output file path
- `--title`: Plot title
- `--no-show`: Don't display plot
- `--verbose`: Verbose output

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

### Melanopic Ratio
The ratio of melanopic to photopic luminous flux, indicating the relative strength of the non-visual (circadian) response compared to the visual response.

### Melanopic Response
The absolute melanopic luminous flux, measured in melanopic lux.

### Scotopic/Photopic Ratio
The ratio of scotopic (rod-based) to photopic (cone-based) luminous flux, indicating the relative strength of night vision compared to day vision.

### Melanopic/Photopic Ratio
Similar to melanopic ratio but specifically comparing melanopic to photopic responses.

## Advanced Plotting Features

### Line Colors and Styles
- Automatic color assignment for multiple spectra
- Customizable line styles through the plotting functions

### Text Size and Font
- Configurable through matplotlib parameters
- Responsive sizing for different output formats

### Title and Legend Control
- Custom titles for all plots
- Legend positioning (upper-left, upper-right, lower-left, lower-right, center)
- Optional legend display

### Export Quality
- High-resolution PNG (300 DPI)
- Scalable vector formats (SVG, PDF)
- Print-ready output

## Examples

### Web Interface Examples

1. **Upload a UPRtek file**: Select the file, choose "UPRtek" as photometer type, enable melanopic curve
2. **Compare three spectra**: Enter CSV data for incandescent, halogen, and LED spectra
3. **Export for publication**: Use SVG format for high-quality vector graphics

### CLI Examples

```bash
# Analyze a single spectrum with full metrics
python cli.py single CSVs/incandescent.csv --normalize --melanopic-curve --output incandescent.png

# Compare traditional light sources
python cli.py compare CSVs/incandescent.csv CSVs/halogen.csv CSVs/led2700.csv --normalize --title "Traditional Light Sources"

# Batch process a directory
python cli.py batch CSVs/2019_lightfair/ --normalize --output lightfair_comparison.png --verbose
```

## Troubleshooting

### Common Issues

1. **File not found**: Ensure file paths are correct and files exist
2. **Import errors**: Check file format and photometer type selection
3. **Plot not displaying**: Use `--no-show` to save without displaying
4. **Memory issues**: Process fewer files at once for large datasets

### Web Interface Issues

1. **Upload fails**: Check file size (max 16MB) and format
2. **Plot not loading**: Refresh page and try again
3. **Export fails**: Ensure plot data is available before exporting

## Development

### Project Structure

```
beautiful-photometry/
├── app.py                 # Flask web application
├── cli.py                 # Command-line interface
├── requirements.txt       # Python dependencies
├── templates/            # HTML templates
│   └── index.html
├── static/               # Static assets
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── src/                  # Core photometry modules
│   ├── spectrum.py
│   ├── plot.py
│   ├── photometer.py
│   ├── human_circadian.py
│   └── human_visual.py
├── CSVs/                 # Example data files
└── uploads/              # Temporary upload directory
```

### Adding New Features

1. **New plot types**: Extend the plotting functions in `src/plot.py`
2. **Additional metrics**: Add calculation functions to the appropriate modules
3. **New file formats**: Extend the import functions in `src/spectrum.py`

## License

Distributed under the MIT license. See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Acknowledgments

- Based on the Colour Science library
- Inspired by the original Beautiful Photometry project
- Built with Flask, Bootstrap, and modern web technologies 