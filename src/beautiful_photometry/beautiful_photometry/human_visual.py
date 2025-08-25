"""
Calculations related to the human visual system, such as rods and cones
"""
import numpy as np

from .spectrum import get_reference_spectrum
from .utils import round_output
from colour import SpectralDistribution

"""
Gets the scotopic sensitivity curve

@return SpectralPowerDistribution       The scotopic SPD
"""
def get_scotopic_curve():
    spectrum = get_reference_spectrum('Scotopic')
    return spectrum['curve']


"""
Gets the photopic (daytime visual) sensitivity curve

@return SpectralPowerDistribution       The photopic SPD
"""
def get_photopic_curve():
    spectrum = get_reference_spectrum('Photopic')
    return spectrum['curve']


"""
Gets the L Cone (Red/Erythropic) sensitivity curve

@return SpectralPowerDistribution       The L Cone SPD
"""
def get_l_cone_curve():
    spectrum = get_reference_spectrum('L Cone')
    return spectrum['curve']


"""
Gets the M Cone (Green/Chloropic) sensitivity curve

@return SpectralPowerDistribution       The M Cone SPD
"""
def get_m_cone_curve():
    spectrum = get_reference_spectrum('M Cone')
    return spectrum['curve']


"""
Gets the S Cone (Blue/Cyanopic) sensitivity curve

@return SpectralPowerDistribution       The S Cone SPD
"""
def get_s_cone_curve():
    spectrum = get_reference_spectrum('S Cone')
    return spectrum['curve']


"""
Calculates the visual/photopic response for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to a 1 decimal place

@return float                                   The photopic response
"""
def photopic_response(spd, toround=True):
    photopic_spd = get_photopic_curve()
    
    # Align wavelengths
    photopic_wavelengths = np.array(photopic_spd.wavelengths)
    spd_wavelengths = np.array(spd.wavelengths)
    photopic_values = np.array(photopic_spd.values)
    spd_values = np.array(spd.values)
    
    # Ensure wavelengths are sorted and unique
    photopic_sorted_idx = np.argsort(photopic_wavelengths)
    photopic_wavelengths = photopic_wavelengths[photopic_sorted_idx]
    photopic_values = photopic_values[photopic_sorted_idx]
    
    spd_sorted_idx = np.argsort(spd_wavelengths)
    spd_wavelengths = spd_wavelengths[spd_sorted_idx]
    spd_values = spd_values[spd_sorted_idx]
    
    # Find overlapping range
    min_wavelength = max(np.min(photopic_wavelengths), np.min(spd_wavelengths))
    max_wavelength = min(np.max(photopic_wavelengths), np.max(spd_wavelengths))
    
    # Create common wavelength array
    common_wavelengths = np.arange(int(min_wavelength), int(max_wavelength) + 1)
    
    # Interpolate both to common wavelengths
    photopic_interp = np.interp(common_wavelengths, photopic_wavelengths, photopic_values)
    spd_interp = np.interp(common_wavelengths, spd_wavelengths, spd_values)
    
    # Calculate response
    resp = np.sum(np.multiply(photopic_interp, spd_interp))
    return round_output(resp, toround, 1)


"""
Calculates the scotopic (low-light visual) response for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to a 1 decimal place

@return float                                   The scotopic response
"""
def scotopic_response(spd, toround=True):
    scotopic_spd = get_scotopic_curve()
    
    # Align wavelengths
    scotopic_wavelengths = np.array(scotopic_spd.wavelengths)
    spd_wavelengths = np.array(spd.wavelengths)
    scotopic_values = np.array(scotopic_spd.values)
    spd_values = np.array(spd.values)
    
    # Ensure wavelengths are sorted and unique
    scotopic_sorted_idx = np.argsort(scotopic_wavelengths)
    scotopic_wavelengths = scotopic_wavelengths[scotopic_sorted_idx]
    scotopic_values = scotopic_values[scotopic_sorted_idx]
    
    spd_sorted_idx = np.argsort(spd_wavelengths)
    spd_wavelengths = spd_wavelengths[spd_sorted_idx]
    spd_values = spd_values[spd_sorted_idx]
    
    # Find overlapping range
    min_wavelength = max(np.min(scotopic_wavelengths), np.min(spd_wavelengths))
    max_wavelength = min(np.max(scotopic_wavelengths), np.max(spd_wavelengths))
    
    # Create common wavelength array
    common_wavelengths = np.arange(int(min_wavelength), int(max_wavelength) + 1)
    
    # Interpolate both to common wavelengths
    scotopic_interp = np.interp(common_wavelengths, scotopic_wavelengths, scotopic_values)
    spd_interp = np.interp(common_wavelengths, spd_wavelengths, spd_values)
    
    # Calculate response
    resp = np.sum(np.multiply(scotopic_interp, spd_interp))
    return round_output(resp, toround, 1)


"""
Calculates the S/P ratio for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to 2 decimal places

@return float                                   The S/P ratio
"""
def scotopic_photopic_ratio(spd, toround=True):
    return round_output(scotopic_response(spd, False) / photopic_response(spd, False), toround)
