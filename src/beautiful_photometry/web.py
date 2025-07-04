"""
Beautiful Photometry Web Application

A Flask-based web interface for analyzing and visualizing spectral power distributions.
"""

import os
import io
import base64
import json
from pathlib import Path
from typing import Optional, Dict, Any, List

from flask import Flask, render_template, request, jsonify, send_file, current_app
from werkzeug.utils import secure_filename
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from colour import SpectralDistribution, SpectralShape
import tempfile

from .spectrum import import_spd, normalize_spd, create_colour_spd, reshape
from .plot import plot_spectrum, plot_multi_spectrum
from .human_circadian import melanopic_ratio, melanopic_response, melanopic_lumens, melanopic_photopic_ratio
from .human_visual import scotopic_photopic_ratio
from .photometer import uprtek_import_spectrum


def create_app(config: Optional[Dict[str, Any]] = None) -> Flask:
    """
    Create and configure the Flask application.
    
    Args:
        config: Optional configuration dictionary
        
    Returns:
        Configured Flask application
    """
    app = Flask(__name__, 
                template_folder='templates',
                static_folder='static')
    
    # Default configuration
    app.config.update({
        'SECRET_KEY': os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production'),
        'UPLOAD_FOLDER': os.environ.get('UPLOAD_FOLDER', 'uploads'),
        'MAX_CONTENT_LENGTH': int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024)),  # 16MB
        'ALLOWED_EXTENSIONS': {'csv', 'xls', 'txt'},
    })
    
    # Override with provided config
    if config:
        app.config.update(config)
    
    # Ensure upload directory exists
    Path(app.config['UPLOAD_FOLDER']).mkdir(parents=True, exist_ok=True)
    
    # Register routes
    register_routes(app)
    
    return app


def register_routes(app: Flask) -> None:
    """Register all application routes."""
    
    @app.route('/')
    def index():
        """Main application page."""
        return render_template('index.html')
    
    @app.route('/upload', methods=['POST'])
    def upload_file():
        """Handle single SPD file upload and processing."""
        try:
            input_method = request.form.get('input_method', 'upload')
            
            if input_method == 'upload':
                if 'file' not in request.files:
                    return jsonify({'error': 'No file provided'}), 400
                
                file = request.files['file']
                if file.filename == '':
                    return jsonify({'error': 'No file selected'}), 400
                
                if not allowed_file(file.filename, app.config['ALLOWED_EXTENSIONS']):
                    return jsonify({'error': 'Invalid file type. Please upload CSV, XLS, or TXT files.'}), 400
                
                # Process uploaded file
                spd = process_uploaded_file(
                    file, 
                    request.form.get('spd_name', ''),
                    float(request.form.get('weight', 1.0)),
                    request.form.get('normalize', 'false').lower() == 'true',
                    request.form.get('photometer', None),
                    app.config['UPLOAD_FOLDER']
                )
                
            elif input_method == 'csv':
                csv_file_path = request.form.get('csv_file', '')
                if not csv_file_path:
                    return jsonify({'error': 'No CSV file selected'}), 400
                
                # Process selected CSV file
                spd = process_csv_file(
                    csv_file_path,
                    request.form.get('spd_name', ''),
                    float(request.form.get('weight', 1.0)),
                    request.form.get('normalize', 'false').lower() == 'true',
                    request.form.get('photometer', None)
                )
            else:
                return jsonify({'error': 'Invalid input method'}), 400
            
            # Calculate metrics
            metrics = calculate_spd_metrics(spd)
            
            # Create plot
            plot_options = {
                'spd': spd,
                'figsize': (10, 6),
                'suppress': True,
                'title': spd.strict_name,
                'melanopic_curve': request.form.get('melanopic_curve', 'false').lower() == 'true',
                'melanopic_stimulus': request.form.get('melanopic_stimulus', 'false').lower() == 'true',
                'hideyaxis': request.form.get('hideyaxis', 'false').lower() == 'true'
            }
            
            plot_image = create_plot_image(plot_spectrum, **plot_options)
            
            return jsonify({
                'success': True,
                'metrics': metrics,
                'plot_image': plot_image
            })
            
        except Exception as e:
            current_app.logger.error(f"Upload error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/compare', methods=['POST'])
    def compare_spectra():
        """Handle multiple spectrum comparison."""
        try:
            data = request.get_json()
            spds_data = data.get('spectra', [])
            
            if len(spds_data) < 2:
                return jsonify({'error': 'At least 2 spectra are required for comparison'}), 400
            
            spds = []
            for spd_data in spds_data:
                if 'csv_data' in spd_data:
                    # Handle CSV data input
                    csv_data = spd_data['csv_data']
                    spd_name = spd_data.get('name', 'Custom SPD')
                    weight = float(spd_data.get('weight', 1.0))
                    normalize = spd_data.get('normalize', False)
                    
                    # Parse CSV data
                    lines = csv_data.strip().split('\n')
                    spd_dict = {}
                    for line in lines:
                        if ',' in line:
                            wavelength, intensity = line.split(',')
                            try:
                                spd_dict[int(wavelength.strip())] = float(intensity.strip())
                            except ValueError:
                                continue
                    
                    if normalize:
                        spd_dict = normalize_spd(spd_dict)
                    
                    spd = create_colour_spd(spd_dict, spd_name)
                    spd = reshape(spd)
                    spds.append(spd)
            
            if len(spds) < 2:
                return jsonify({'error': 'Could not process enough spectra for comparison'}), 400
            
            # Create comparison plot
            plot_options = {
                'spds': spds,
                'figsize': (12, 8),
                'suppress': True,
                'title': data.get('title', 'Spectral Comparison'),
                'melanopic_curve': data.get('melanopic_curve', False),
                'hideyaxis': data.get('hideyaxis', False),
                'showlegend': data.get('showlegend', True),
                'legend_loc': data.get('legend_loc', 'upper left')
            }
            
            plot_image = create_plot_image(plot_multi_spectrum, **plot_options)
            
            # Calculate metrics for each SPD
            metrics = [calculate_spd_metrics(spd) for spd in spds]
            
            return jsonify({
                'success': True,
                'metrics': metrics,
                'plot_image': plot_image
            })
            
        except Exception as e:
            current_app.logger.error(f"Compare error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/export', methods=['POST'])
    def export_plot():
        """Handle plot export in various formats."""
        try:
            data = request.get_json()
            plot_type = data.get('plot_type', 'single')
            format_type = data.get('format', 'png')
            
            if format_type not in ['png', 'svg', 'pdf']:
                return jsonify({'error': 'Unsupported format'}), 400
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(suffix=f'.{format_type}', delete=False) as tmp_file:
                temp_path = tmp_file.name
            
            try:
                # For now, return an error as export needs to be implemented
                return jsonify({'error': 'Export functionality not yet implemented'}), 501
                
            finally:
                # Clean up
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                    
        except Exception as e:
            current_app.logger.error(f"Export error: {str(e)}")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/api/reference-spectra')
    def get_reference_spectra():
        """Get list of available reference spectra."""
        try:
            from .spectrum import import_reference_spectra, reference_spectra
            
            if not reference_spectra:
                import_reference_spectra()
            
            spectra_list = [{'name': spec['name'], 'description': spec['description']} 
                           for spec in reference_spectra]
            
            return jsonify({'spectra': spectra_list})
        except Exception as e:
            current_app.logger.error(f"Reference spectra error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/csv-files')
    def get_csv_files():
        """Get list of available CSV files in the CSVs directory."""
        try:
            csv_dir = Path('CSVs')
            if not csv_dir.exists():
                return jsonify({'files': []})
            
            files = []
            for file_path in csv_dir.rglob('*'):
                if file_path.is_file() and file_path.suffix.lower() in ['.csv', '.xls', '.txt']:
                    # Get relative path from CSVs directory
                    rel_path = file_path.relative_to(csv_dir)
                    files.append({
                        'name': file_path.name,
                        'path': str(rel_path),
                        'full_path': str(file_path),
                        'size': file_path.stat().st_size,
                        'category': str(rel_path.parent) if rel_path.parent != Path('.') else 'Root'
                    })
            
            # Sort by category, then by name
            files.sort(key=lambda x: (x['category'], x['name']))
            
            return jsonify({'files': files})
        except Exception as e:
            current_app.logger.error(f"CSV files error: {str(e)}")
            return jsonify({'error': str(e)}), 500

    @app.route('/api/csv-files/<path:file_path>')
    def get_csv_file(file_path):
        """Get the contents of a specific CSV file."""
        try:
            csv_file = Path('CSVs') / file_path
            
            # Security check: ensure the file is within the CSVs directory
            if not csv_file.resolve().is_relative_to(Path('CSVs').resolve()):
                return jsonify({'error': 'Access denied'}), 403
            
            if not csv_file.exists():
                return jsonify({'error': 'File not found'}), 404
            
            # Read file contents
            with open(csv_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            return jsonify({
                'name': csv_file.name,
                'path': file_path,
                'content': content
            })
        except Exception as e:
            current_app.logger.error(f"CSV file read error: {str(e)}")
            return jsonify({'error': str(e)}), 500


def allowed_file(filename: str, allowed_extensions: set) -> bool:
    """Check if a filename has an allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions


def process_uploaded_file(
    file, 
    spd_name: Optional[str] = None, 
    weight: float = 1.0, 
    normalize: bool = False, 
    photometer: Optional[str] = None,
    upload_folder: str = 'uploads'
) -> SpectralDistribution:
    """Process an uploaded file and return an SPD object."""
    if not spd_name:
        spd_name = secure_filename(file.filename).split('.')[0]
    
    # Save file temporarily
    temp_path = Path(upload_folder) / secure_filename(file.filename)
    file.save(temp_path)
    
    try:
        # Import the SPD
        spd = import_spd(str(temp_path), spd_name, weight, normalize, photometer)
        return spd
    finally:
        # Clean up temporary file
        if temp_path.exists():
            temp_path.unlink()


def process_csv_file(
    csv_file_path: str,
    spd_name: Optional[str] = None,
    weight: float = 1.0,
    normalize: bool = False,
    photometer: Optional[str] = None
) -> SpectralDistribution:
    """Process a CSV file from the CSVs directory and return an SPD object."""
    csv_file = Path('CSVs') / csv_file_path
    
    # Security check: ensure the file is within the CSVs directory
    if not csv_file.resolve().is_relative_to(Path('CSVs').resolve()):
        raise ValueError('Access denied: File must be within CSVs directory')
    
    if not csv_file.exists():
        raise FileNotFoundError(f'CSV file not found: {csv_file_path}')
    
    if not spd_name:
        spd_name = csv_file.stem
    
    # Import the SPD
    spd = import_spd(str(csv_file), spd_name, weight, normalize, photometer)
    return spd


def calculate_spd_metrics(spd: SpectralDistribution) -> Dict[str, Any]:
    """Calculate all metrics for a given SPD."""
    return {
        'name': spd.strict_name,
        'melanopic_ratio': round(melanopic_ratio(spd), 3),
        'melanopic_response': round(melanopic_response(spd), 1),
        'scotopic_photopic_ratio': round(scotopic_photopic_ratio(spd), 3),
        'melanopic_photopic_ratio': round(melanopic_photopic_ratio(spd), 3)
    }


def create_plot_image(plot_func, *args, **kwargs) -> str:
    """Create a plot and return it as a base64 encoded image."""
    # Create the plot
    plot_func(*args, **kwargs)
    
    # Save to bytes buffer
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=300, bbox_inches='tight')
    img_buffer.seek(0)
    
    # Clear the plot
    plt.close()
    
    # Convert to base64
    img_str = base64.b64encode(img_buffer.getvalue()).decode()
    return img_str


# For backward compatibility
def run_app(host='0.0.0.0', port=8765, debug=True):
    """Run the Flask application (for development)."""
    app = create_app()
    app.run(debug=debug, host=host, port=port)


if __name__ == '__main__':
    run_app() 