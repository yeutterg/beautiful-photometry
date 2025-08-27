import os
import io
import base64
import json
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
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

# Enable CORS for all routes
CORS(app, origins=['http://localhost:3000', 'http://frontend:3000'])

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'xls', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_plot_image(plot_func, dpi=300, *args, **kwargs):
    """Create a plot and return it as a base64 encoded image"""
    # Create the plot
    plot_func(*args, **kwargs)
    
    # Save to bytes buffer
    img_buffer = io.BytesIO()
    plt.savefig(img_buffer, format='png', dpi=dpi, bbox_inches='tight')
    img_buffer.seek(0)
    
    # Clear the plot
    plt.close()
    
    # Convert to base64
    img_str = base64.b64encode(img_buffer.getvalue()).decode()
    return img_str

def detect_file_format(filepath):
    """Detect if file is UPRtek format or manual CSV format"""
    try:
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            first_line = f.readline().strip()
            
            # Check for UPRtek format - tab-delimited with "Model Name" in first column
            if '\t' in first_line:
                parts = first_line.split('\t')
                if len(parts) >= 2 and 'model' in parts[0].lower():
                    # It's a UPRtek file
                    return 'uprtek'
            
            # Check if it's a manual CSV with wavelength,intensity format
            # Try to parse the first line as numbers
            if ',' in first_line:
                parts = first_line.split(',')
                if len(parts) >= 2:
                    try:
                        # Try to convert both parts to numbers
                        float(parts[0])
                        float(parts[1])
                        return None  # It's a manual CSV
                    except ValueError:
                        # Not numbers, might be headers - check second line
                        second_line = f.readline().strip()
                        if second_line and ',' in second_line:
                            parts = second_line.split(',')
                            if len(parts) >= 2:
                                try:
                                    float(parts[0])
                                    float(parts[1])
                                    return None  # Manual CSV with headers
                                except ValueError:
                                    pass
            
            # Default to manual CSV format
            return None
    except Exception as e:
        print(f"Error detecting file format: {e}")
        return None

def process_uploaded_file(file, spd_name=None, weight=1.0, normalize=False, photometer=None):
    """Process an uploaded file and return an SPD object"""
    if not spd_name:
        spd_name = secure_filename(file.filename).split('.')[0]
    
    # Generate unique filename to avoid conflicts
    import uuid
    unique_filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
    
    # Save file temporarily
    file.save(temp_path)
    
    try:
        # Auto-detect file format if photometer not specified
        if photometer is None or photometer == 'auto':
            detected_format = detect_file_format(temp_path)
            photometer = detected_format
            print(f"Detected file format: {detected_format if detected_format else 'manual CSV'}")
        
        # Import the SPD
        print(f"Calling import_spd with photometer={repr(photometer)}")
        spd = import_spd(temp_path, spd_name, weight, normalize, photometer)
        print(f"SPD imported successfully")
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
    print(f"\n=== Starting upload process ===", flush=True)
    import sys
    sys.stdout.flush()
    sys.stderr.flush()
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        print(f"File received: {file.filename}")
        
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
        
        print(f"Parameters: name='{spd_name}', weight={weight}, normalize={normalize}, photometer={photometer}")
        
        # Process the file
        spd = process_uploaded_file(file, spd_name, weight, normalize, photometer)
        print(f"SPD processed: {spd.name if spd else 'None'}")
        
        print(f"Processed SPD: {spd.name}, wavelengths: {len(spd.wavelengths)}, shape: {spd.shape}")
        
        # Calculate metrics
        metrics = {
            'name': spd.name,
            'melanopic_ratio': round(melanopic_ratio(spd), 3),
            'melanopic_response': round(melanopic_response(spd), 1),
            'scotopic_photopic_ratio': round(scotopic_photopic_ratio(spd), 3),
            'melanopic_photopic_ratio': round(melanopic_photopic_ratio(spd), 3)
        }
        print(f"Calculated metrics: {metrics}")
        
        # Create plot
        plot_options = {
            'spd': spd,
            'figsize': (10, 6),
            'suppress': True,
            'title': spd.name,
            'melanopic_curve': request.form.get('melanopic_curve', 'false').lower() == 'true',
            'melanopic_stimulus': request.form.get('melanopic_stimulus', 'false').lower() == 'true',
            'hideyaxis': request.form.get('hideyaxis', 'false').lower() == 'true'
        }
        
        plot_image = create_plot_image(plot_spectrum, **plot_options)
        
        # Extract the raw SPD data for future re-analysis
        spd_data = {}
        wavelengths = spd.wavelengths
        values = spd.values
        print(f"Extracting SPD data: {len(wavelengths)} wavelengths")
        for i, wavelength in enumerate(wavelengths):
            spd_data[str(int(wavelength))] = float(values[i])
        print(f"Extracted SPD data keys (first 5): {list(spd_data.keys())[:5]}")
        
        response_data = {
            'success': True,
            'metrics': metrics,
            'plot_image': plot_image,
            'spd_data': spd_data
        }
        print(f"Response ready: success={response_data['success']}, has_metrics={bool(metrics)}, has_plot={bool(plot_image)}, spd_data_count={len(spd_data)}")
        print("=== Upload process complete ===\n")
        
        return jsonify(response_data)
        
    except Exception as e:
        import traceback
        error_msg = f"Upload error: {str(e)}"
        print(error_msg)
        print(traceback.format_exc())
        return jsonify({'error': error_msg, 'success': False}), 500

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
                'name': spd.name,
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

@app.route('/export-image', methods=['POST'])
def export_image():
    try:
        data = request.get_json()
        
        # Get the base64 image from the request
        plot_image = data.get('plot_image')
        if not plot_image:
            return jsonify({'error': 'No plot image provided'}), 400
        
        # Decode the base64 image
        img_data = base64.b64decode(plot_image)
        
        # Create a BytesIO object
        img_buffer = io.BytesIO(img_data)
        img_buffer.seek(0)
        
        # Send as downloadable file
        return send_file(
            img_buffer,
            mimetype='image/png',
            as_attachment=True,
            download_name=f'spectrum_plot_{data.get("name", "analysis")}.png'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reference-spectra')
def get_reference_spectra():
    """Get list of available reference spectra"""
    try:
        from src.beautiful_photometry.beautiful_photometry.spectrum import import_reference_spectra, reference_spectra
        
        if not reference_spectra:
            import_reference_spectra()
        
        spectra_list = [{'name': spec['name'], 'description': spec['description']} 
                       for spec in reference_spectra]
        
        return jsonify({'spectra': spectra_list})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_spd():
    """Analyze an SPD with given options"""
    try:
        data = request.json
        
        # Get the SPD data (this would normally come from stored SPDs)
        spd_data = data.get('spd_data')
        spd_name = data.get('name', 'SPD')
        options = data.get('options', {})
        
        # For now, create a simple SPD from the uploaded data
        # In production, you'd retrieve this from storage
        from src.beautiful_photometry.beautiful_photometry.spectrum import create_colour_spd
        
        # First ensure the SPD data has numeric keys and is sorted
        sorted_spd_data = {}
        for key, value in spd_data.items():
            try:
                wavelength = float(key)
                sorted_spd_data[wavelength] = float(value)
            except (ValueError, TypeError):
                continue
        
        # Sort by wavelength
        sorted_spd_data = dict(sorted(sorted_spd_data.items()))
        
        if not sorted_spd_data:
            return jsonify({'error': 'Invalid SPD data format'}), 400
        
        # Apply normalization if requested (after sorting)
        if options.get('normalize', False):
            sorted_spd_data = normalize_spd(sorted_spd_data)
        
        # Create SPD object
        spd = create_colour_spd(sorted_spd_data, spd_name)
        
        # Calculate metrics
        metrics = {
            'name': spd.name,
            'melanopic_ratio': round(melanopic_ratio(spd), 3),
            'melanopic_response': round(melanopic_response(spd), 1),
            'scotopic_photopic_ratio': round(scotopic_photopic_ratio(spd), 3),
            'melanopic_photopic_ratio': round(melanopic_photopic_ratio(spd), 3)
        }
        
        # Get X-axis limits from options
        x_min = options.get('x_min')
        x_max = options.get('x_max')
        
        # If both are provided, use them; otherwise let plot_spectrum use data range
        if x_min is not None and x_max is not None:
            xlim = (int(x_min), int(x_max))
        else:
            xlim = None  # Let plot_spectrum determine from data
        
        # Get plot dimensions from options (convert pixels to inches at 100 DPI)
        width_px = int(options.get('width', 1000))
        height_px = int(options.get('height', 600))
        figsize = (width_px / 100, height_px / 100)
        
        # Combine melanopic options - if melanopic_response is true, show both curve and stimulus
        show_melanopic = options.get('melanopic_response', False)
        
        # Create plot with options
        plot_options = {
            'spd': spd,
            'figsize': figsize,
            'suppress': True,
            'title': spd.name if options.get('show_title', True) else None,
            'show_legend': options.get('show_legend', True),
            'melanopic_curve': show_melanopic,
            'melanopic_stimulus': show_melanopic,
            'hideyaxis': options.get('hide_y_axis', False),
            'xlim': xlim,
            'show_spectral_ranges': options.get('show_spectral_ranges', False)
        }
        
        # Use 100 DPI since we're controlling size via figsize
        plot_img = create_plot_image(plot_spectrum, dpi=100, **plot_options)
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'plot_image': plot_img
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    print(f"Unhandled exception: {e}", flush=True)
    print(traceback.format_exc(), flush=True)
    return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080) 