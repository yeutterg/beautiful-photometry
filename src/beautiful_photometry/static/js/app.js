// Beautiful Photometry Web Interface JavaScript

class BeautifulPhotometry {
    constructor() {
        this.currentPlotData = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupSpectrumInputs();
    }

    bindEvents() {
        // Single SPD form submission
        document.getElementById('singleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSingleSPD();
        });

        // Compare spectra form submission
        document.getElementById('compareForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCompareSpectra();
        });

        // Export buttons
        document.getElementById('exportPng').addEventListener('click', () => this.exportPlot('png'));
        document.getElementById('exportSvg').addEventListener('click', () => this.exportPlot('svg'));
        document.getElementById('exportPdf').addEventListener('click', () => this.exportPlot('pdf'));

        // Add spectrum button
        document.getElementById('addSpectrum').addEventListener('click', () => {
            this.addSpectrumInput();
        });

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Auto-fill SPD name from filename
                const name = file.name.split('.')[0];
                document.getElementById('spdName').value = name;
            }
        });

        // Input method radio buttons
        document.querySelectorAll('input[name="inputMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleInputMethod(e.target.value);
            });
        });

        // CSV file selection change
        document.getElementById('csvFileSelect').addEventListener('change', (e) => {
            const selectedFile = e.target.value;
            if (selectedFile) {
                // Auto-fill SPD name from filename
                const name = selectedFile.split('/').pop().split('.')[0];
                document.getElementById('spdName').value = name;
            }
        });

        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                this.hideResults();
                // Load CSV files when CSV tab is shown or when switching to single tab
                if (e.target.id === 'csv-files-tab' || e.target.id === 'single-tab') {
                    this.loadCsvFiles();
                }
            });
        });

        // Refresh CSV files button
        document.getElementById('refreshCsvFiles').addEventListener('click', () => {
            this.loadCsvFiles();
        });
    }

    setupSpectrumInputs() {
        // Add event listeners to existing spectrum inputs
        this.updateSpectrumInputListeners();
    }

    updateSpectrumInputListeners() {
        // Remove spectrum buttons
        document.querySelectorAll('.btn-remove-spectrum').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const spectrumInput = e.target.closest('.spectrum-input');
                if (document.querySelectorAll('.spectrum-input').length > 1) {
                    spectrumInput.remove();
                }
            });
        });
    }

    addSpectrumInput() {
        const container = document.getElementById('spectraInputs');
        const newInput = document.createElement('div');
        newInput.className = 'spectrum-input mb-3';
        newInput.innerHTML = `
            <div class="input-group">
                <input type="text" class="form-control" placeholder="Spectrum name" name="spectrum_name">
                <button type="button" class="btn btn-outline-danger btn-remove-spectrum">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <textarea class="form-control mt-2" rows="3" placeholder="CSV data (wavelength,intensity)&#10;380,0.048&#10;381,0.051&#10;..."></textarea>
            <div class="row mt-2">
                <div class="col-6">
                    <input type="number" class="form-control" placeholder="Weight" value="1.0" step="0.1" min="0">
                </div>
                <div class="col-6">
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox">
                        <label class="form-check-label">Normalize</label>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(newInput);
        this.updateSpectrumInputListeners();
    }

    async handleSingleSPD() {
        const inputMethod = document.querySelector('input[name="inputMethod"]:checked').value;
        const formData = new FormData();
        
        if (inputMethod === 'upload') {
            const fileInput = document.getElementById('fileInput');
            if (!fileInput.files[0]) {
                this.showError('Please select a file to upload.');
                return;
            }
            formData.append('file', fileInput.files[0]);
        } else if (inputMethod === 'csv') {
            const csvFileSelect = document.getElementById('csvFileSelect');
            const selectedFile = csvFileSelect.value;
            if (!selectedFile) {
                this.showError('Please select a CSV file.');
                return;
            }
            formData.append('csv_file', selectedFile);
        }

        formData.append('input_method', inputMethod);
        formData.append('spd_name', document.getElementById('spdName').value);
        formData.append('weight', document.getElementById('weight').value);
        formData.append('normalize', document.getElementById('normalize').checked);
        formData.append('photometer', document.getElementById('photometer').value);
        formData.append('melanopic_curve', document.getElementById('melanopicCurve').checked);
        formData.append('melanopic_stimulus', document.getElementById('melanopicStimulus').checked);
        formData.append('hideyaxis', document.getElementById('hideYAxis').checked);

        this.showLoading();
        
        try {
            // Add timeout to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
            
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.displaySingleResults(result);
                this.currentPlotData = {
                    type: 'single',
                    spd_data: {
                        name: result.metrics.name,
                        weight: document.getElementById('weight').value,
                        normalize: document.getElementById('normalize').checked,
                        photometer: document.getElementById('photometer').value
                    }
                };
            } else {
                this.showError(result.error || 'An error occurred while processing the file.');
            }
        } catch (error) {
            console.error('Single SPD error:', error);
            if (error.name === 'AbortError') {
                this.showError('Request timed out. Please try again with a smaller file or check your connection.');
            } else {
                this.showError('Network error: ' + error.message);
            }
        } finally {
            this.hideLoading();
        }
    }

    toggleInputMethod(method) {
        const uploadSection = document.getElementById('uploadSection');
        const csvSection = document.getElementById('csvSection');
        const fileInput = document.getElementById('fileInput');
        
        if (method === 'upload') {
            uploadSection.style.display = 'block';
            csvSection.style.display = 'none';
            fileInput.required = true;
        } else if (method === 'csv') {
            uploadSection.style.display = 'none';
            csvSection.style.display = 'block';
            fileInput.required = false;
            // Load CSV files if not already loaded
            this.loadCsvFilesForSelect();
        }
    }

    async handleCompareSpectra() {
        const spectra = [];
        const spectrumInputs = document.querySelectorAll('.spectrum-input');
        
        for (let input of spectrumInputs) {
            const name = input.querySelector('input[type="text"]').value;
            const csvData = input.querySelector('textarea').value;
            const weight = input.querySelector('input[type="number"]').value;
            const normalize = input.querySelector('input[type="checkbox"]').checked;
            
            if (name && csvData.trim()) {
                spectra.push({
                    name: name,
                    csv_data: csvData,
                    weight: parseFloat(weight),
                    normalize: normalize
                });
            }
        }

        if (spectra.length < 2) {
            this.showError('Please provide at least 2 spectra for comparison.');
            return;
        }

        const requestData = {
            spectra: spectra,
            title: document.getElementById('compareTitle').value || 'Spectral Comparison',
            melanopic_curve: document.getElementById('compareMelanopicCurve').checked,
            hideyaxis: document.getElementById('compareHideYAxis').checked,
            showlegend: document.getElementById('showLegend').checked,
            legend_loc: document.getElementById('legendLocation').value
        };

        this.showLoading();
        
        try {
            const response = await fetch('/compare', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.displayCompareResults(result);
                this.currentPlotData = {
                    type: 'compare',
                    spectra: spectra,
                    plot_options: requestData
                };
            } else {
                this.showError(result.error || 'An error occurred while comparing spectra.');
            }
        } catch (error) {
            this.showError('Network error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    displaySingleResults(result) {
        const plotImage = document.getElementById('plotImage');
        plotImage.src = 'data:image/png;base64,' + result.plot_image;
        
        this.displayMetrics([result.metrics]);
        this.showResults();
    }

    displayCompareResults(result) {
        const plotImage = document.getElementById('plotImage');
        plotImage.src = 'data:image/png;base64,' + result.plot_image;
        
        this.displayMetrics(result.metrics);
        this.showResults();
    }

    displayMetrics(metrics) {
        const container = document.getElementById('metricsTable');
        container.innerHTML = '';
        
        metrics.forEach(metric => {
            const metricDiv = document.createElement('div');
            metricDiv.className = 'mb-3';
            
            const title = document.createElement('h6');
            title.className = 'text-primary mb-2';
            title.textContent = metric.name;
            metricDiv.appendChild(title);
            
            const metricsList = [
                { label: 'Melanopic Ratio', value: metric.melanopic_ratio },
                { label: 'Melanopic Response', value: metric.melanopic_response },
                { label: 'Scotopic/Photopic', value: metric.scotopic_photopic_ratio },
                { label: 'Melanopic/Photopic', value: metric.melanopic_photopic_ratio }
            ];
            
            metricsList.forEach(item => {
                const row = document.createElement('div');
                row.className = 'metric-row';
                row.innerHTML = `
                    <span class="metric-label">${item.label}</span>
                    <span class="metric-value">${item.value}</span>
                `;
                metricDiv.appendChild(row);
            });
            
            container.appendChild(metricDiv);
        });
    }

    async exportPlot(format) {
        if (!this.currentPlotData) {
            this.showError('No plot data available for export.');
            return;
        }

        try {
            const response = await fetch('/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    plot_type: this.currentPlotData.type,
                    format: format,
                    ...this.currentPlotData
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `photometry_plot.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const result = await response.json();
                this.showError(result.error || 'Export failed.');
            }
        } catch (error) {
            this.showError('Export error: ' + error.message);
        }
    }

    showResults() {
        document.getElementById('welcome').style.display = 'none';
        document.getElementById('results').style.display = 'block';
        document.getElementById('results').classList.add('fade-in');
    }

    hideResults() {
        document.getElementById('results').style.display = 'none';
        document.getElementById('welcome').style.display = 'block';
    }

    showLoading() {
        const modal = new bootstrap.Modal(document.getElementById('loadingModal'));
        modal.show();
    }

    hideLoading() {
        try {
            const modalElement = document.getElementById('loadingModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                } else {
                    // If no instance exists, create one and hide it
                    const newModal = new bootstrap.Modal(modalElement);
                    newModal.hide();
                }
            }
        } catch (error) {
            console.error('Error hiding loading modal:', error);
            // Fallback: manually hide the modal
            const modalElement = document.getElementById('loadingModal');
            if (modalElement) {
                modalElement.style.display = 'none';
                modalElement.classList.remove('show');
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
            }
        }
    }

    showError(message) {
        // Create and show error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    showSuccess(message) {
        // Create and show success alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-success alert-dismissible fade show';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 3000);
    }

    async loadCsvFiles() {
        const container = document.getElementById('csvFilesContainer');
        container.innerHTML = '<div class="text-center text-muted"><i class="fas fa-spinner fa-spin"></i> Loading CSV files...</div>';
        
        try {
            const response = await fetch('/api/csv-files');
            const result = await response.json();
            
            if (result.files && result.files.length > 0) {
                this.displayCsvFiles(result.files);
                // Also populate the single SPD CSV selector
                this.populateCsvSelector(result.files);
            } else {
                container.innerHTML = '<div class="text-center text-muted">No CSV files found in the CSVs directory.</div>';
                this.populateCsvSelector([]);
            }
        } catch (error) {
            container.innerHTML = '<div class="text-center text-danger">Error loading CSV files: ' + error.message + '</div>';
            this.populateCsvSelector([]);
        }
    }

    loadCsvFilesForSelect() {
        // Load CSV files specifically for the single SPD selector
        fetch('/api/csv-files')
            .then(response => response.json())
            .then(result => {
                if (result.files && result.files.length > 0) {
                    this.populateCsvSelector(result.files);
                } else {
                    this.populateCsvSelector([]);
                }
            })
            .catch(error => {
                console.error('Error loading CSV files for selector:', error);
                this.populateCsvSelector([]);
            });
    }

    populateCsvSelector(files) {
        const selector = document.getElementById('csvFileSelect');
        selector.innerHTML = '<option value="">Select a CSV file...</option>';
        
        if (files.length === 0) {
            selector.innerHTML = '<option value="">No CSV files available</option>';
            return;
        }
        
        // Group files by category
        const categories = {};
        files.forEach(file => {
            if (!categories[file.category]) {
                categories[file.category] = [];
            }
            categories[file.category].push(file);
        });
        
        // Add options grouped by category
        Object.keys(categories).sort().forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category;
            
            categories[category].forEach(file => {
                const option = document.createElement('option');
                option.value = file.path;
                option.textContent = file.name;
                optgroup.appendChild(option);
            });
            
            selector.appendChild(optgroup);
        });
    }

    displayCsvFiles(files) {
        const container = document.getElementById('csvFilesContainer');
        
        // Group files by category
        const categories = {};
        files.forEach(file => {
            if (!categories[file.category]) {
                categories[file.category] = [];
            }
            categories[file.category].push(file);
        });
        
        let html = '';
        
        Object.keys(categories).sort().forEach(category => {
            html += `<div class="mb-4">`;
            html += `<h6 class="text-muted mb-2"><i class="fas fa-folder me-1"></i>${category}</h6>`;
            
            categories[category].forEach(file => {
                const fileSize = this.formatFileSize(file.size);
                html += `
                    <div class="card mb-2">
                        <div class="card-body p-2">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>${file.name}</strong>
                                    <small class="text-muted d-block">${file.path}</small>
                                </div>
                                <div class="text-end">
                                    <small class="text-muted">${fileSize}</small>
                                    <div class="btn-group btn-group-sm mt-1">
                                        <button class="btn btn-outline-primary btn-sm" onclick="app.viewCsvFile('${file.path}')">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                        <button class="btn btn-outline-success btn-sm" onclick="app.useCsvFile('${file.path}')">
                                            <i class="fas fa-plus"></i> Use
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        });
        
        container.innerHTML = html;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async viewCsvFile(filePath) {
        try {
            const response = await fetch(`/api/csv-files/${encodeURIComponent(filePath)}`);
            const result = await response.json();
            
            if (result.content) {
                // Create a modal to display the file content
                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.innerHTML = `
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">${result.name}</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <pre class="bg-light p-3" style="max-height: 400px; overflow-y: auto;">${this.escapeHtml(result.content)}</pre>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="app.useCsvFile('${filePath}')">Use This File</button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                const modalInstance = new bootstrap.Modal(modal);
                modalInstance.show();
                
                // Clean up modal after it's hidden
                modal.addEventListener('hidden.bs.modal', () => {
                    modal.remove();
                });
            } else {
                this.showError('Could not load file content.');
            }
        } catch (error) {
            this.showError('Error loading file: ' + error.message);
        }
    }

    async useCsvFile(filePath) {
        try {
            const response = await fetch(`/api/csv-files/${encodeURIComponent(filePath)}`);
            const result = await response.json();
            
            if (result.content) {
                // Switch to the compare tab and add the CSV data
                const compareTab = document.getElementById('compare-tab');
                const tab = new bootstrap.Tab(compareTab);
                tab.show();
                
                // Add a new spectrum input with the CSV data
                this.addSpectrumInput();
                const lastInput = document.querySelector('.spectrum-input:last-child');
                
                // Fill in the data
                const nameInput = lastInput.querySelector('input[type="text"]');
                const csvTextarea = lastInput.querySelector('textarea');
                
                nameInput.value = result.name.split('.')[0]; // Remove extension
                csvTextarea.value = result.content;
                
                this.showSuccess(`Added ${result.name} to comparison.`);
            } else {
                this.showError('Could not load file content.');
            }
        } catch (error) {
                this.showError('Error loading file: ' + error.message);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BeautifulPhotometry();
}); 