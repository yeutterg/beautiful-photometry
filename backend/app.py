import os
import io
import base64
import json
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import threading

# Create a lock for matplotlib operations to ensure thread safety
matplotlib_lock = threading.Lock()
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

# Enable CORS for all routes (including development ports)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://frontend:3000'])

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'csv', 'xls', 'txt'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def create_plot_image(plot_func, dpi=300, *args, **kwargs):
    """Create a plot and return it as a base64 encoded image with thread safety"""
    with matplotlib_lock:
        try:
            # Clear any existing plots first
            plt.close('all')
            
            # Create a new figure explicitly
            fig = plt.figure(figsize=kwargs.get('figsize', (10, 6)))
            
            # Create the plot
            plot_func(*args, **kwargs)
            
            # Get the current figure (in case plot_func created a new one)
            current_fig = plt.gcf()
            
            # Save to bytes buffer
            img_buffer = io.BytesIO()
            current_fig.savefig(img_buffer, format='png', dpi=dpi, bbox_inches='tight', 
                               facecolor='white', edgecolor='none')
            img_buffer.seek(0)
            
            # Convert to base64
            img_str = base64.b64encode(img_buffer.getvalue()).decode()
            
            # Clear the figure and close it
            current_fig.clear()
            plt.close(current_fig)
            plt.close('all')  # Extra safety to close any remaining figures
            
            # Clear matplotlib's internal state
            plt.clf()
            plt.cla()
            
            return img_str
            
        except Exception as e:
            # Make sure to clean up even if there's an error
            plt.close('all')
            print(f"Error creating plot: {str(e)}")
            raise
        finally:
            # Final cleanup
            img_buffer.close() if 'img_buffer' in locals() else None

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

def load_spd_from_file(filepath):
    """Load SPD data from a file and return as dict"""
    try:
        # Auto-detect file format
        photometer = detect_file_format(filepath)
        
        # Import the SPD
        filename = os.path.basename(filepath)
        name = os.path.splitext(filename)[0]
        spd = import_spd(filepath, name, weight=1.0, normalize=False, photometer=photometer)
        
        # Extract wavelength-value pairs
        spd_data = {}
        for i, wavelength in enumerate(spd.wavelengths):
            spd_data[str(int(wavelength))] = float(spd.values[i])
        
        return spd_data
    except Exception as e:
        print(f"Error loading SPD from {filepath}: {e}")
        return None

def process_uploaded_file(file, spd_name=None, weight=1.0, normalize=False, photometer=None):
    """Process an uploaded file and return an SPD object"""
    if not spd_name:
        spd_name = secure_filename(file.filename).split('.')[0]
    
    # Save file permanently to CSVs/user folder
    user_csv_dir = os.path.join('CSVs', 'user')
    os.makedirs(user_csv_dir, exist_ok=True)
    
    # Generate unique filename to avoid conflicts
    import uuid
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    original_filename = secure_filename(file.filename)
    base_name, ext = os.path.splitext(original_filename)
    unique_filename = f"{base_name}_{timestamp}{ext}"
    file_path = os.path.join(user_csv_dir, unique_filename)
    
    # Save file permanently
    file.save(file_path)
    
    try:
        # Auto-detect file format if photometer not specified
        if photometer is None or photometer == 'auto':
            detected_format = detect_file_format(file_path)
            photometer = detected_format
            print(f"Detected file format: {detected_format if detected_format else 'manual CSV'}")
        
        # Import the SPD
        print(f"Calling import_spd with photometer={repr(photometer)}")
        spd = import_spd(file_path, spd_name, weight, normalize, photometer)
        print(f"SPD imported successfully, saved to: {file_path}")
        return spd
    except Exception as e:
        # If import fails, remove the saved file
        if os.path.exists(file_path):
            os.remove(file_path)
        raise

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/health')
def health():
    """Health check endpoint that tests matplotlib"""
    try:
        # Test matplotlib
        with matplotlib_lock:
            plt.close('all')
            fig = plt.figure(figsize=(5, 3))
            plt.plot([1, 2, 3], [1, 2, 3])
            plt.title('Test Plot')
            plt.close(fig)
        return jsonify({'status': 'healthy', 'matplotlib': 'ok'})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500

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
        
        # Save the uploaded file to CSVs/user folder
        user_csv_dir = os.path.join('CSVs', 'user')
        os.makedirs(user_csv_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_name = secure_filename(file.filename).rsplit('.', 1)[0]
        extension = file.filename.rsplit('.', 1)[1] if '.' in file.filename else 'csv'
        saved_filename = f"{safe_name}_{timestamp}.{extension}"
        saved_filepath = os.path.join(user_csv_dir, saved_filename)
        
        # Save the file
        file.save(saved_filepath)
        print(f"File saved to: {saved_filepath}")
        
        # Process the saved file
        file.seek(0)  # Reset file pointer for processing
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

@app.route('/paste', methods=['POST'])
def paste_csv():
    """Handle pasted CSV data and save to CSVs/user folder"""
    try:
        data = request.get_json()
        csv_data = data.get('csv_data', '')
        spd_name = data.get('name', 'Pasted SPD')
        
        if not csv_data.strip():
            return jsonify({'error': 'No CSV data provided'}), 400
        
        # Save CSV data to file in CSVs/user folder
        user_csv_dir = os.path.join('CSVs', 'user')
        os.makedirs(user_csv_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_name = secure_filename(spd_name).replace(' ', '_')
        if not safe_name:
            safe_name = 'pasted_spd'
        filename = f"{safe_name}_{timestamp}.csv"
        filepath = os.path.join(user_csv_dir, filename)
        
        # Write CSV data to file
        with open(filepath, 'w') as f:
            f.write(csv_data)
        
        try:
            # Import the SPD from the saved file
            spd = import_spd(filepath, spd_name, weight=1.0, normalize=False, photometer=None)
            
            # Calculate metrics
            metrics = {
                'name': spd.name,
                'melanopic_ratio': round(melanopic_ratio(spd), 3),
                'melanopic_response': round(melanopic_response(spd), 1),
                'scotopic_photopic_ratio': round(scotopic_photopic_ratio(spd), 3),
                'melanopic_photopic_ratio': round(melanopic_photopic_ratio(spd), 3)
            }
            
            # Extract SPD data for response
            spd_data = {}
            for i, wavelength in enumerate(spd.wavelengths):
                spd_data[str(int(wavelength))] = float(spd.values[i])
            
            return jsonify({
                'success': True,
                'metrics': metrics,
                'spd_data': spd_data,
                'filepath': filepath,
                'message': f'SPD saved to {filename}'
            })
            
        except Exception as e:
            # If import fails, remove the saved file
            if os.path.exists(filepath):
                os.remove(filepath)
            raise
            
    except Exception as e:
        import traceback
        error_msg = f"Paste error: {str(e)}"
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
        
        # Get plot dimensions from options (convert pixels to inches at 100 DPI)
        width_px = int(data.get('chart_width', 1000))
        height_px = int(data.get('chart_height', 600))
        figsize = (width_px / 100, height_px / 100)
        
        # Get SPD line options
        show_spd_line = data.get('show_spd_line', True)
        spd_line_color = data.get('spd_line_color', '#000000')
        spd_line_weight = float(data.get('spd_line_weight', 0.5))
        
        # Create comparison plot
        plot_options = {
            'spds': spds,
            'figsize': figsize,
            'suppress': True,
            'melanopic_curve': data.get('melanopic_curve', False),
            'hideyaxis': data.get('hideyaxis', False),
            'showlegend': data.get('show_legend', True),
            'legend_loc': data.get('legend_loc', 'upper left'),
            'line_weight': spd_line_weight
        }
        
        # Only add title if it's explicitly provided
        title = data.get('title')
        if title and title.strip():
            plot_options['title'] = title
        
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

@app.route('/api/library')
def get_library_items():
    """Get all SPD files from CSVs folder and subdirectories"""
    try:
        library_items = []
        csv_dir = 'CSVs'
        
        # Ensure we're in the right directory
        if not os.path.exists(csv_dir):
            csv_dir = os.path.join('/app', 'CSVs')
            if not os.path.exists(csv_dir):
                print(f"ERROR: CSVs directory not found. CWD: {os.getcwd()}")
                return jsonify({'error': 'CSVs directory not found', 'items': []}), 200
        
        print(f"Loading library from: {os.path.abspath(csv_dir)}, CWD: {os.getcwd()}")
        
        # Walk through all subdirectories in CSVs folder
        for root, dirs, files in os.walk(csv_dir):
            for filename in files:
                if filename.lower().endswith(('.csv', '.txt', '.xls')) and not filename.startswith('.'):
                    filepath = os.path.join(root, filename)
                    rel_path = os.path.relpath(filepath, csv_dir)
                    
                    # Determine source folder (examples or user)
                    source = 'examples' if 'examples' in rel_path else 'user' if 'user' in rel_path else 'other'
                    
                    # Get file modification time
                    mtime = os.path.getmtime(filepath)
                    created_date = datetime.fromtimestamp(mtime).isoformat()
                    
                    # Try to load the SPD data
                    try:
                        spd_data = load_spd_from_file(filepath)
                        if spd_data:
                            item_id = rel_path.replace(os.sep, '_').replace('.', '_')
                            print(f"Loading library item: {filename} -> ID: {item_id}, Path: {rel_path}")
                            library_items.append({
                                'id': item_id,
                                'title': os.path.splitext(filename)[0],
                                'filepath': rel_path,
                                'folder': os.path.dirname(rel_path) if os.path.dirname(rel_path) else 'root',
                                'type': 'SPD',
                                'createdDate': created_date,
                                'data': spd_data
                            })
                    except Exception as e:
                        print(f"Error loading {filepath}: {str(e)}")
                        continue
        
        # Sort items by filepath for consistent ordering
        library_items.sort(key=lambda x: x['filepath'])
        print(f"Returning {len(library_items)} library items")
        for item in library_items[:5]:  # Log first 5 items for debugging
            print(f"  - ID: {item['id']}, Title: {item['title']}, Path: {item['filepath']}")
        return jsonify({'items': library_items})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/library/<path:filepath>')
def get_library_item(filepath):
    """Get a specific SPD file from the library"""
    try:
        full_path = os.path.join('CSVs', filepath)
        if not os.path.exists(full_path):
            return jsonify({'error': 'File not found'}), 404
            
        spd_data = load_spd_from_file(full_path)
        if spd_data:
            return jsonify({
                'filepath': filepath,
                'name': os.path.splitext(os.path.basename(filepath))[0],
                'data': spd_data
            })
        else:
            return jsonify({'error': 'Could not parse SPD file'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/library/rename', methods=['POST'])
def rename_library_item():
    """Rename a library item (CSV file)"""
    try:
        data = request.get_json()
        old_filepath = data.get('filepath')
        new_title = data.get('newTitle')
        
        if not old_filepath or not new_title:
            return jsonify({'error': 'Missing filepath or newTitle'}), 400
        
        # Construct full paths
        old_path = os.path.join('CSVs', old_filepath)
        if not os.path.exists(old_path):
            return jsonify({'error': 'File not found'}), 404
        
        # Generate new filename preserving directory structure
        directory = os.path.dirname(old_path)
        extension = os.path.splitext(old_path)[1]
        safe_title = secure_filename(new_title).replace(' ', '_')
        new_filename = f"{safe_title}{extension}"
        new_path = os.path.join(directory, new_filename)
        
        # Check if new path already exists
        if os.path.exists(new_path) and new_path != old_path:
            return jsonify({'error': 'A file with that name already exists'}), 409
        
        # Rename the file
        os.rename(old_path, new_path)
        
        # Return new filepath relative to CSVs folder
        new_relative_path = os.path.relpath(new_path, 'CSVs')
        
        return jsonify({
            'success': True,
            'newFilepath': new_relative_path,
            'newId': new_relative_path.replace(os.sep, '_').replace('.', '_')
        })
        
    except Exception as e:
        import traceback
        print(f"Rename error: {str(e)}")
        print(traceback.format_exc())
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
        width_px = int(options.get('chart_width', 1000))
        height_px = int(options.get('chart_height', 600))
        figsize = (width_px / 100, height_px / 100)
        
        # Get melanopic option from frontend
        show_melanopic = options.get('melanopic_curve', False)
        
        # Get title from options - only use if explicitly provided and not empty
        chart_title = options.get('title')
        print(f"DEBUG: chart_title from options: {repr(chart_title)}, type: {type(chart_title)}")
        
        # Get SPD line options
        show_spd_line = options.get('show_spd_line', True)
        spd_line_color = options.get('spd_line_color', 'black')
        spd_line_weight = options.get('spd_line_weight', 2)
        
        # Convert hex color to matplotlib color format if needed
        if spd_line_color.startswith('#'):
            # Hex color is fine for matplotlib
            pass
        
        # Create plot with options
        plot_options = {
            'spd': spd,
            'figsize': figsize,
            'suppress': True,
            'show_legend': options.get('show_legend', True),
            'melanopic_curve': show_melanopic,
            'melanopic_stimulus': show_melanopic,
            'hideyaxis': options.get('hideyaxis', False),
            'xlim': xlim,
            'show_spectral_ranges': options.get('show_spectral_ranges', False),
            'show_spd_line': show_spd_line,
            'spd_line_color': spd_line_color,
            'spd_line_weight': spd_line_weight
        }
        
        # Only add title if it's explicitly provided and not empty
        # Check for None, empty string, and the string "undefined"
        if chart_title and chart_title not in [None, '', 'undefined'] and chart_title.strip():
            plot_options['title'] = chart_title
            print(f"DEBUG: Adding title to plot_options: {chart_title}")
        else:
            print(f"DEBUG: Not adding title to plot_options")
        
        # Use 100 DPI since we're controlling size via figsize
        try:
            print(f"Creating plot with options: {plot_options}")
            plot_img = create_plot_image(plot_spectrum, dpi=100, **plot_options)
            print(f"Plot created successfully, size: {len(plot_img)} bytes")
        except Exception as plot_error:
            print(f"Error creating plot: {str(plot_error)}")
            import traceback
            traceback.print_exc()
            # Try to create a simple fallback plot
            try:
                plt.close('all')
                simple_options = {
                    'spd': spd,
                    'figsize': (10, 6),
                    'suppress': True,
                    'title': spd.name
                }
                plot_img = create_plot_image(plot_spectrum, dpi=100, **simple_options)
                print("Fallback plot created successfully")
            except:
                return jsonify({'error': f'Failed to create plot: {str(plot_error)}'}), 500
        
        return jsonify({
            'success': True,
            'metrics': metrics,
            'plot_image': plot_img
        })
        
    except Exception as e:
        print(f"Analyze endpoint error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    print(f"Unhandled exception: {e}", flush=True)
    print(traceback.format_exc(), flush=True)
    return jsonify({'error': str(e), 'success': False}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080) 