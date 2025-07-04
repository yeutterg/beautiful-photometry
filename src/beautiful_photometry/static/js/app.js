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

        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                this.hideResults();
            });
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
        const formData = new FormData();
        const fileInput = document.getElementById('fileInput');
        
        if (!fileInput.files[0]) {
            this.showError('Please select a file to upload.');
            return;
        }

        formData.append('file', fileInput.files[0]);
        formData.append('spd_name', document.getElementById('spdName').value);
        formData.append('weight', document.getElementById('weight').value);
        formData.append('normalize', document.getElementById('normalize').checked);
        formData.append('photometer', document.getElementById('photometer').value);
        formData.append('melanopic_curve', document.getElementById('melanopicCurve').checked);
        formData.append('melanopic_stimulus', document.getElementById('melanopicStimulus').checked);
        formData.append('hideyaxis', document.getElementById('hideYAxis').checked);

        this.showLoading();
        
        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

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
            this.showError('Network error: ' + error.message);
        } finally {
            this.hideLoading();
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
        const modal = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
        if (modal) {
            modal.hide();
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BeautifulPhotometry();
}); 