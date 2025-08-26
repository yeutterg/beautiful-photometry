/**
 * Beautiful Photometry Web Interface
 * Redesigned with separated SPD management and analysis
 */

class SPDManager {
    constructor() {
        this.spds = new Map(); // Store SPDs by ID
        this.nextId = 1;
        this.selectedFile = null;
        this.loadFromLocalStorage();
        this.initializeEventListeners();
    }
    
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('spdData');
            if (stored) {
                const data = JSON.parse(stored);
                this.nextId = data.nextId || 1;
                if (data.spds) {
                    data.spds.forEach(spd => {
                        this.spds.set(spd.id, spd);
                    });
                    // Update UI with loaded SPDs
                    this.updateSPDList();
                    this.updateDropdowns();
                }
            }
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
        }
    }
    
    saveToLocalStorage() {
        try {
            const data = {
                nextId: this.nextId,
                spds: Array.from(this.spds.values())
            };
            localStorage.setItem('spdData', JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    initializeEventListeners() {
        // Upload button
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        // Paste button
        document.getElementById('pasteBtn').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('pasteModal'));
            modal.show();
        });

        // Confirm paste
        document.getElementById('confirmPasteBtn').addEventListener('click', () => {
            this.handlePasteData();
        });

        // Confirm upload
        document.getElementById('confirmUploadBtn').addEventListener('click', () => {
            this.handleFileUpload();
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.performAnalysis();
        });

        // Load reference spectra
        document.getElementById('loadReferenceBtn').addEventListener('click', () => {
            this.loadReferenceSpectra();
        });

        // Export image button
        document.getElementById('exportImageBtn').addEventListener('click', () => {
            this.exportImage();
        });
        
        // Export data button
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        // Primary SPD dropdown change
        document.getElementById('primarySPD').addEventListener('change', (e) => {
            const spdId = e.target.value;
            if (spdId) {
                // Populate x-min, x-max, and title when SPD is selected
                const spd = this.spds.get(spdId);
                if (spd && spd.data) {
                    const wavelengths = Object.keys(spd.data).map(w => parseInt(w)).filter(w => !isNaN(w));
                    if (wavelengths.length > 0) {
                        const minWavelength = Math.min(...wavelengths);
                        const maxWavelength = Math.max(...wavelengths);
                        
                        document.getElementById('xMin').value = minWavelength;
                        document.getElementById('xMax').value = maxWavelength;
                        document.getElementById('chartTitle').value = spd.name;
                    }
                }
            }
        });
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            // Show name modal
            document.getElementById('uploadSpdName').value = file.name.replace(/\.[^/.]+$/, "");
            const modal = new bootstrap.Modal(document.getElementById('uploadNameModal'));
            modal.show();
        }
    }

    async handleFileUpload() {
        if (!this.selectedFile) return;

        const formData = new FormData();
        formData.append('file', this.selectedFile);
        
        const spdName = document.getElementById('uploadSpdName').value || 
                        this.selectedFile.name.replace(/\.[^/.]+$/, "");
        formData.append('spd_name', spdName);
        formData.append('weight', '1.0');
        formData.append('normalize', 'false');

        this.showLoading();

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Upload response:', result);
            console.log('Response status:', response.status);

            if ((result.success || result.metrics) && response.ok) {
                console.log('Processing successful upload for:', spdName);
                // Store the SPD with raw data for re-analysis
                const spdId = `spd_${this.nextId++}`;
                this.spds.set(spdId, {
                    id: spdId,
                    name: spdName,
                    data: result.spd_data || null,  // Store raw SPD data for re-analysis
                    metrics: result.metrics,
                    plot_image: result.plot_image,
                    uploadTime: new Date().toISOString()
                });
                console.log('SPD stored with ID:', spdId);

                this.updateSPDList();
                this.updateDropdowns();
                this.saveToLocalStorage();
                this.showSuccess(`SPD "${spdName}" uploaded successfully`);
                
                // Auto-select the newly uploaded SPD if nothing is selected
                const primarySelect = document.getElementById('primarySPD');
                if (!primarySelect.value || primarySelect.value === '') {
                    primarySelect.value = spdId;
                }
                
                // Set default X-axis values based on data range
                if (result.spd_data) {
                    const wavelengths = Object.keys(result.spd_data).map(w => parseInt(w));
                    const minWavelength = Math.min(...wavelengths);
                    const maxWavelength = Math.max(...wavelengths);
                    
                    // Update X-axis inputs if they're empty
                    const xMinInput = document.getElementById('xMin');
                    const xMaxInput = document.getElementById('xMax');
                    if (!xMinInput.value) xMinInput.value = minWavelength;
                    if (!xMaxInput.value) xMaxInput.value = maxWavelength;
                }
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('uploadNameModal')).hide();
                
                // Reset file input
                document.getElementById('fileInput').value = '';
                this.selectedFile = null;
            } else {
                console.error('Upload failed:', result);
                this.showError(result.error || `Upload failed: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error('Network error:', error);
            this.showError('Network error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    async handlePasteData() {
        const name = document.getElementById('pasteSpdName').value;
        const data = document.getElementById('pasteData').value;

        if (!name || !data) {
            this.showError('Please provide both name and data');
            return;
        }

        // Create a blob from the pasted data
        const blob = new Blob([data], { type: 'text/csv' });
        const file = new File([blob], `${name}.csv`, { type: 'text/csv' });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('spd_name', name);
        formData.append('weight', '1.0');
        formData.append('normalize', 'false');

        this.showLoading();

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success || result.metrics) {
                // Store the SPD
                const spdId = `spd_${this.nextId++}`;
                this.spds.set(spdId, {
                    id: spdId,
                    name: name,
                    data: result.spd_data || null,
                    metrics: result.metrics,
                    plot_image: result.plot_image,
                    uploadTime: new Date().toISOString()
                });

                this.updateSPDList();
                this.updateDropdowns();
                this.showSuccess(`SPD "${name}" added successfully`);
                
                // Auto-select the newly added SPD if nothing is selected
                const primarySelect = document.getElementById('primarySPD');
                if (!primarySelect.value || primarySelect.value === '') {
                    primarySelect.value = spdId;
                }
                
                // Close modal and reset
                bootstrap.Modal.getInstance(document.getElementById('pasteModal')).hide();
                document.getElementById('pasteSpdName').value = '';
                document.getElementById('pasteData').value = '';
            } else {
                this.showError(result.error || 'Failed to add SPD');
            }
        } catch (error) {
            this.showError('Network error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    updateSPDList() {
        const listContainer = document.getElementById('spdList');
        listContainer.innerHTML = '';

        if (this.spds.size === 0) {
            listContainer.innerHTML = '<div class="text-muted p-3 text-center">No SPDs loaded</div>';
            return;
        }

        this.spds.forEach((spd) => {
            const item = document.createElement('div');
            item.className = 'list-group-item spd-list-item';
            item.dataset.spdId = spd.id;
            
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong>${spd.name}</strong>
                        <small class="text-muted d-block">
                            ${new Date(spd.uploadTime).toLocaleTimeString()}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="spdManager.removeSPD('${spd.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            item.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this.selectSPD(spd.id);
                }
            });
            
            listContainer.appendChild(item);
        });
    }

    updateDropdowns() {
        const primarySelect = document.getElementById('primarySPD');
        const compareSelect = document.getElementById('compareSPD');
        
        // Save current selections
        const currentPrimary = primarySelect.value;
        const currentCompare = compareSelect.value;
        
        // Clear and repopulate
        primarySelect.innerHTML = '<option value="">Select an SPD...</option>';
        compareSelect.innerHTML = '<option value="">None</option>';
        
        this.spds.forEach((spd) => {
            primarySelect.innerHTML += `<option value="${spd.id}">${spd.name}</option>`;
            compareSelect.innerHTML += `<option value="${spd.id}">${spd.name}</option>`;
        });
        
        // Restore selections if still valid
        if (this.spds.has(currentPrimary)) {
            primarySelect.value = currentPrimary;
        }
        if (this.spds.has(currentCompare)) {
            compareSelect.value = currentCompare;
        }
    }

    selectSPD(spdId) {
        // Update visual selection
        document.querySelectorAll('.spd-list-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const selectedItem = document.querySelector(`[data-spd-id="${spdId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
        
        // Set as primary SPD in dropdown
        document.getElementById('primarySPD').value = spdId;
        
        // Populate x-min and x-max from the SPD data if available
        const spd = this.spds.get(spdId);
        if (spd && spd.data) {
            const wavelengths = Object.keys(spd.data).map(w => parseInt(w)).filter(w => !isNaN(w));
            if (wavelengths.length > 0) {
                const minWavelength = Math.min(...wavelengths);
                const maxWavelength = Math.max(...wavelengths);
                
                // Set the values in the input fields
                document.getElementById('xMin').value = minWavelength;
                document.getElementById('xMax').value = maxWavelength;
                
                // Also update the chart title with the SPD name
                document.getElementById('chartTitle').value = spd.name;
            }
        }
    }

    removeSPD(spdId) {
        if (confirm('Are you sure you want to remove this SPD?')) {
            this.spds.delete(spdId);
            this.updateSPDList();
            this.updateDropdowns();
            this.saveToLocalStorage();
            this.showSuccess('SPD removed');
        }
    }

    async performAnalysis() {
        const primaryId = document.getElementById('primarySPD').value;
        
        if (!primaryId) {
            this.showError('Please select a primary SPD for analysis');
            return;
        }
        
        const primarySPD = this.spds.get(primaryId);
        const compareId = document.getElementById('compareSPD').value;
        
        // Get analysis options
        const xMinValue = document.getElementById('xMin').value.trim();
        const xMaxValue = document.getElementById('xMax').value.trim();
        
        const options = {
            normalize: document.getElementById('normalize').checked,
            melanopic_response: document.getElementById('melanopicResponse').checked,
            hide_y_axis: document.getElementById('hideYAxis').checked,
            show_title: document.getElementById('showTitle').checked,
            show_legend: document.getElementById('showLegend').checked,
            show_spectral_ranges: document.getElementById('showSpectralRanges').checked,
            width: parseInt(document.getElementById('plotWidth').value) || 1000,
            height: parseInt(document.getElementById('plotHeight').value) || 600
        };
        
        // Add custom title if provided
        const chartTitle = document.getElementById('chartTitle').value.trim();
        if (chartTitle) {
            options.custom_title = chartTitle;
        }
        
        // Only include x_min and x_max if both are provided
        if (xMinValue && xMaxValue) {
            options.x_min = parseInt(xMinValue);
            options.x_max = parseInt(xMaxValue);
        }
        
        // If we have SPD data, re-analyze with current options
        if (primarySPD.data) {
            this.showLoading();
            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        spd_data: primarySPD.data,
                        name: chartTitle || primarySPD.name,
                        options: options
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Update stored SPD with new analysis results
                    primarySPD.metrics = result.metrics;
                    primarySPD.plot_image = result.plot_image;
                    
                    // Display results
                    this.displayResults(primarySPD, compareId && this.spds.has(compareId) ? this.spds.get(compareId) : null);
                } else {
                    this.showError(result.error || 'Analysis failed');
                }
            } catch (error) {
                this.showError('Analysis error: ' + error.message);
            } finally {
                this.hideLoading();
            }
        } else {
            // Use existing analysis
            this.displayResults(primarySPD, compareId && this.spds.has(compareId) ? this.spds.get(compareId) : null);
        }
        
        // Enable export buttons and store current plot
        document.getElementById('exportImageBtn').disabled = false;
        document.getElementById('exportDataBtn').disabled = false;
        this.currentPlotImage = primarySPD.plot_image;
        this.currentSPDName = primarySPD.name;
    }

    displayResults(primarySPD, compareSPD = null) {
        // Hide empty state
        document.getElementById('emptyState').classList.add('d-none');
        
        // Show results area
        document.getElementById('resultsArea').classList.remove('d-none');
        
        // Display metrics
        const metricsGrid = document.getElementById('metricsGrid');
        metricsGrid.innerHTML = '';
        
        if (primarySPD.metrics) {
            const metrics = [
                { label: 'Melanopic Ratio', value: primarySPD.metrics.melanopic_ratio },
                { label: 'Melanopic Response', value: primarySPD.metrics.melanopic_response },
                { label: 'S/P Ratio', value: primarySPD.metrics.scotopic_photopic_ratio },
                { label: 'M/P Ratio', value: primarySPD.metrics.melanopic_photopic_ratio }
            ];
            
            metrics.forEach(metric => {
                const card = document.createElement('div');
                card.className = 'metric-card';
                card.innerHTML = `
                    <div class="metric-value">${metric.value || 'N/A'}</div>
                    <div class="metric-label">${metric.label}</div>
                `;
                metricsGrid.appendChild(card);
            });
        }
        
        // Display plot if available
        if (primarySPD.plot_image) {
            const plotContainer = document.getElementById('plotContainer');
            plotContainer.innerHTML = `<img src="data:image/png;base64,${primarySPD.plot_image}" class="img-fluid">`;
        }
    }

    async loadReferenceSpectra() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/reference-spectra');
            const result = await response.json();
            
            if (result.spectra) {
                // Add reference spectra to the SPD list
                result.spectra.forEach(spec => {
                    const spdId = `ref_${spec.name.replace(/\s+/g, '_')}`;
                    if (!this.spds.has(spdId)) {
                        this.spds.set(spdId, {
                            id: spdId,
                            name: `[REF] ${spec.name}`,
                            description: spec.description,
                            isReference: true,
                            uploadTime: new Date().toISOString()
                        });
                    }
                });
                
                this.updateSPDList();
                this.updateDropdowns();
                this.showSuccess('Reference spectra loaded');
            }
        } catch (error) {
            this.showError('Failed to load reference spectra');
        } finally {
            this.hideLoading();
        }
    }

    async exportImage() {
        if (!this.currentPlotImage) {
            this.showError('No plot image available to export');
            return;
        }
        
        try {
            // Create a blob from the base64 image
            const response = await fetch(`data:image/png;base64,${this.currentPlotImage}`);
            const blob = await response.blob();
            
            // Create a download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `spectrum_${this.currentSPDName || 'analysis'}_${new Date().getTime()}.png`;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showSuccess('Image exported successfully');
        } catch (error) {
            this.showError('Failed to export image: ' + error.message);
        }
    }
    
    exportData() {
        const primaryId = document.getElementById('primarySPD').value;
        if (!primaryId) {
            this.showError('No SPD selected for export');
            return;
        }
        
        const spd = this.spds.get(primaryId);
        if (!spd || !spd.data) {
            this.showError('No SPD data available to export');
            return;
        }
        
        // Convert SPD data to CSV format
        let csv = 'Wavelength,Intensity\n';
        for (const [wavelength, intensity] of Object.entries(spd.data)) {
            csv += `${wavelength},${intensity}\n`;
        }
        
        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${spd.name}_data.csv`;
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.showSuccess('Data exported successfully');
    }

    // Utility methods
    showLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('d-none');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('d-none');
        }
    }

    showError(message) {
        const alertEl = document.getElementById('errorAlert');
        if (alertEl) {
            document.getElementById('errorMessage').textContent = message;
            alertEl.classList.remove('d-none');
            
            setTimeout(() => {
                alertEl.classList.add('d-none');
            }, 5000);
        }
    }

    showSuccess(message) {
        const alertEl = document.getElementById('successAlert');
        if (alertEl) {
            document.getElementById('successMessage').textContent = message;
            alertEl.classList.remove('d-none');
            
            setTimeout(() => {
                alertEl.classList.add('d-none');
            }, 3000);
        }
    }

    showInfo(message) {
        // For now, use success alert for info messages
        this.showSuccess(message);
    }
}

// Initialize the SPD Manager when the page loads
let spdManager;
document.addEventListener('DOMContentLoaded', () => {
    spdManager = new SPDManager();
});