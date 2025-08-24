/**
 * Beautiful Photometry Web Interface
 * Redesigned with separated SPD management and analysis
 */

class SPDManager {
    constructor() {
        this.spds = new Map(); // Store SPDs by ID
        this.nextId = 1;
        this.selectedFile = null;
        this.initializeEventListeners();
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

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportResults();
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

            if (result.success || result.metrics) {
                // Store the SPD
                const spdId = `spd_${this.nextId++}`;
                this.spds.set(spdId, {
                    id: spdId,
                    name: spdName,
                    data: result.spd_data || null,
                    metrics: result.metrics,
                    plot_image: result.plot_image,
                    uploadTime: new Date().toISOString()
                });

                this.updateSPDList();
                this.updateDropdowns();
                this.showSuccess(`SPD "${spdName}" uploaded successfully`);
                
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('uploadNameModal')).hide();
                
                // Reset file input
                document.getElementById('fileInput').value = '';
                this.selectedFile = null;
            } else {
                this.showError(result.error || 'Upload failed');
            }
        } catch (error) {
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
    }

    removeSPD(spdId) {
        if (confirm('Are you sure you want to remove this SPD?')) {
            this.spds.delete(spdId);
            this.updateSPDList();
            this.updateDropdowns();
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
        
        // For comparison, we need to re-upload with options
        if (compareId && this.spds.has(compareId)) {
            // Handle comparison
            const compareSPD = this.spds.get(compareId);
            this.showInfo('Comparison analysis coming soon');
            this.displayResults(primarySPD, compareSPD);
        } else {
            // Single SPD analysis - may need to re-analyze with current options
            this.displayResults(primarySPD);
        }
        
        // Enable export button
        document.getElementById('exportBtn').disabled = false;
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

    exportResults() {
        // TODO: Implement export functionality
        this.showInfo('Export functionality coming soon');
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