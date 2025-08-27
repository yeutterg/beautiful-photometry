"""
Calculations related to the human visual system, such as rods and cones
"""
import numpy as np

from .spectrum import get_reference_spectrum
from .utils import round_output
from colour import SpectralDistribution

"""
Gets the scotopic sensitivity curve

@return SpectralDistribution       The scotopic SPD
"""
def get_scotopic_curve():
    spectrum = get_reference_spectrum('Scotopic')
    return spectrum['curve']


"""
Gets the photopic (daytime visual) sensitivity curve

@return SpectralDistribution       The photopic SPD
"""
def get_photopic_curve():
    spectrum = get_reference_spectrum('Photopic')
    return spectrum['curve']


"""
Gets the L Cone (Red/Erythropic) sensitivity curve

@return SpectralDistribution       The L Cone SPD
"""
def get_l_cone_curve():
    spectrum = get_reference_spectrum('L Cone')
    return spectrum['curve']


"""
Gets the M Cone (Green/Chloropic) sensitivity curve

@return SpectralDistribution       The M Cone SPD
"""
def get_m_cone_curve():
    spectrum = get_reference_spectrum('M Cone')
    return spectrum['curve']


"""
Gets the S Cone (Blue/Cyanopic) sensitivity curve

@return SpectralDistribution       The S Cone SPD
"""
def get_s_cone_curve():
    spectrum = get_reference_spectrum('S Cone')
    return spectrum['curve']


"""
Calculates the visual/photopic response for a given light source

@param SpectralDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to a 1 decimal place

@return float                                   The photopic response
"""
def photopic_response(spd, toround=True):
    photopic_spd = get_photopic_curve()
    resp = np.sum(np.multiply(photopic_spd.values, spd.values))
    return round_output(resp, toround, 1)


"""
Calculates the scotopic (low-light visual) response for a given light source

@param SpectralDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to a 1 decimal place

@return float                                   The scotopic response
"""
def scotopic_response(spd, toround=True):
    scotopic_spd = get_scotopic_curve()
    resp = np.sum(np.multiply(scotopic_spd.values, spd.values))
    return round_output(resp, toround, 1)


"""
Calculates the S/P ratio for a given light source

@param SpectralDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to 2 decimal places

@return float                                   The S/P ratio
"""
def scotopic_photopic_ratio(spd, toround=True):
    return round_output(scotopic_response(spd, False) / photopic_response(spd, False), toround)
