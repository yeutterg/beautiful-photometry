"""
Tests for the spectrum module.
"""

import pytest
import tempfile
import os
from pathlib import Path

from beautiful_photometry.spectrum import (
    import_spectral_csv,
    normalize_spd,
    weight_spd,
    create_colour_spd,
    reshape,
    import_spd,
)


class TestSpectrumFunctions:
    """Test spectrum processing functions."""
    
    def test_normalize_spd(self):
        """Test SPD normalization."""
        spd_dict = {380: 0.5, 381: 1.0, 382: 0.8}
        normalized = normalize_spd(spd_dict.copy())
        
        assert normalized[380] == 0.5
        assert normalized[381] == 1.0
        assert normalized[382] == 0.8
        
        # Test with different values
        spd_dict = {380: 10, 381: 20, 382: 15}
        normalized = normalize_spd(spd_dict.copy())
        
        assert normalized[380] == 0.5
        assert normalized[381] == 1.0
        assert normalized[382] == 0.75
    
    def test_weight_spd(self):
        """Test SPD weighting."""
        spd_dict = {380: 0.5, 381: 1.0, 382: 0.8}
        weighted = weight_spd(spd_dict.copy(), 2.0)
        
        assert weighted[380] == 1.0
        assert weighted[381] == 2.0
        assert weighted[382] == 1.6
    
    def test_create_colour_spd(self):
        """Test Colour SPD creation."""
        spd_dict = {380: 0.5, 381: 1.0, 382: 0.8}
        spd = create_colour_spd(spd_dict, "Test SPD")
        
        assert spd.strict_name == "Test SPD"
        assert len(spd.wavelengths) == 3
    
    def test_reshape(self):
        """Test SPD reshaping."""
        spd_dict = {380: 0.5, 381: 1.0, 382: 0.8}
        spd = create_colour_spd(spd_dict, "Test SPD")
        reshaped = reshape(spd)
        
        # Should extend to 360-780 nm with 1nm intervals
        assert min(reshaped.wavelengths) == 360
        assert max(reshaped.wavelengths) == 780
        assert len(reshaped.wavelengths) == 421  # 780 - 360 + 1
    
    def test_import_spectral_csv(self, tmp_path):
        """Test CSV import functionality."""
        # Create a temporary CSV file
        csv_content = "380,0.5\n381,1.0\n382,0.8"
        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)
        
        spd_dict = import_spectral_csv(str(csv_file))
        
        assert spd_dict[380] == 0.5
        assert spd_dict[381] == 1.0
        assert spd_dict[382] == 0.8
    
    def test_import_spd(self, tmp_path):
        """Test SPD import with various options."""
        # Create a temporary CSV file
        csv_content = "380,0.5\n381,1.0\n382,0.8"
        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)
        
        # Test basic import
        spd = import_spd(str(csv_file), "Test SPD")
        assert spd.strict_name == "Test SPD"
        
        # Test with normalization
        spd = import_spd(str(csv_file), "Test SPD", normalize=True)
        assert max(spd.values) == 1.0
        
        # Test with weight
        spd = import_spd(str(csv_file), "Test SPD", weight=2.0)
        assert spd.values[0] == 1.0  # 0.5 * 2.0


class TestSpectrumIntegration:
    """Integration tests for spectrum processing."""
    
    def test_full_workflow(self, tmp_path):
        """Test complete spectrum processing workflow."""
        # Create test data
        csv_content = "380,0.5\n381,1.0\n382,0.8"
        csv_file = tmp_path / "test.csv"
        csv_file.write_text(csv_content)
        
        # Import and process
        spd = import_spd(
            str(csv_file),
            "Test SPD",
            normalize=True,
            weight=1.5
        )
        
        # Verify results
        assert spd.strict_name == "Test SPD"
        assert max(spd.values) == 1.5  # 1.0 * 1.5
        assert min(spd.wavelengths) == 360
        assert max(spd.wavelengths) == 780 