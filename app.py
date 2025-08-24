import os
import io
import base64
import json
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from colour import SpectralDistribution, SpectralShape
import tempfile
import zipfile

# Import the existing photometry modules
from src.beautiful_photometry.beautiful_photometry.spectrum import import_spd, normalize_spd, create_colour_spd, reshape
from src.beautiful_photometry.beautiful_photometry.plot import plot_spectrum, plot_multi_spectrum, generate_color_spectrum
from src.beautiful_photometry.beautiful_photometry.human_circadian import melanopic_ratio, melanopic_response, melanopic_lumens, melanopic_photopic_ratio
from src.beautiful_photometry.beautiful_photometry.human_visual import scotopic_photopic_ratio
from src.beautiful_photometry.beautiful_photometry.photometer import uprtek_import_spectrum

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'xls', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_plot_image(plot_func, *args, **kwargs):
    """Create a plot and return it as a base64 encoded image"""
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

def process_uploaded_file(file, spd_name=None, weight=1.0, normalize=False, photometer=None):
    """Process an uploaded file and return an SPD object"""
    if not spd_name:
        spd_name = secure_filename(file.filename).split('.')[0]
    
    # Save file temporarily
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
    file.save(temp_path)
    
    try:
        # Import the SPD
        spd = import_spd(temp_path, spd_name, weight, normalize, photometer)
        return spd
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload CSV, XLS, or TXT files.'}), 400
        
        # Get parameters from form
        spd_name = request.form.get('spd_name', '')
        weight = float(request.form.get('weight', 1.0))
        normalize = request.form.get('normalize', 'false').lower() == 'true'
        photometer = request.form.get('photometer', None)
        if photometer == 'none':
            photometer = None
        
        # Process the file
        spd = process_uploaded_file(file, spd_name, weight, normalize, photometer)
        
        # Calculate metrics
        metrics = {
            'name': spd.strict_name,
            'melanopic_ratio': round(melanopic_ratio(spd), 3),
            'melanopic_response': round(melanopic_response(spd), 1),
            'scotopic_photopic_ratio': round(scotopic_photopic_ratio(spd), 3),
            'melanopic_photopic_ratio': round(melanopic_photopic_ratio(spd), 3)
        }
        
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
        return jsonify({'error': str(e)}), 500

@app.route('/compare', methods=['POST'])
def compare_spectra():
    try:
        data = request.get_json()
        spds_data = data.get('spectra', [])
        
        if len(spds_data) < 2:
            return jsonify({'error': 'At least 2 spectra are required for comparison'}), 400
        
        spds = []
        for spd_data in spds_data:
            if 'file' in spd_data:
                # Handle file upload
                file_data = spd_data['file']
                # This would need to be handled differently - files should be uploaded separately
                # For now, we'll assume the file was already processed
                pass
            elif 'csv_data' in spd_data:
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
        metrics = []
        for spd in spds:
            metrics.append({
                'name': spd.strict_name,
                'melanopic_ratio': round(melanopic_ratio(spd), 3),
                'melanopic_response': round(melanopic_response(spd), 1),
                'scotopic_photopic_ratio': round(scotopic_photopic_ratio(spd), 3),
                'melanopic_photopic_ratio': round(melanopic_photopic_ratio(spd), 3)
            })
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'plot_image': plot_image
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/export', methods=['POST'])
def export_plot():
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
            if plot_type == 'single':
                # Recreate single plot
                spd_data = data.get('spd_data', {})
                # This would need to recreate the SPD object from the data
                # For now, we'll return an error
                return jsonify({'error': 'Export not yet implemented for single plots'}), 501
            else:
                # Recreate comparison plot
                spds_data = data.get('spectra', [])
                # This would need to recreate the SPD objects from the data
                # For now, we'll return an error
                return jsonify({'error': 'Export not yet implemented for comparison plots'}), 501
            
            # Send file
            return send_file(temp_path, as_attachment=True, download_name=f'plot.{format_type}')
            
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
                
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reference-spectra')
def get_reference_spectra():
    """Get list of available reference spectra"""
    try:
        from src.spectrum import import_reference_spectra, reference_spectra
        
        if not reference_spectra:
            import_reference_spectra()
        
        spectra_list = [{'name': spec['name'], 'description': spec['description']} 
                       for spec in reference_spectra]
        
        return jsonify({'spectra': spectra_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080) 