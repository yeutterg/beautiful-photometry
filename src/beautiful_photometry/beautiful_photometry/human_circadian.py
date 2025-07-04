"""
Calculations related to the human circadian system
"""
import numpy as np
from math import log10

from .spectrum import get_reference_spectrum
from .utils import round_output
from colour import SpectralDistribution
from .human_visual import photopic_response, get_photopic_curve

"""
Gets the melanopic sensitivity curve

@return SpectralPowerDistribution       The melanopic SPD
"""
def get_melanopic_curve():
    spectrum = get_reference_spectrum('Melanopic')
    return spectrum['curve']


"""
Computes the Spectral G-Index

Assumes a photopic reponse only
Uses the equation found here: https://en.wikipedia.org/wiki/Spectral_G-index

@param SpectralPowerDistribution spd            The spectral power distribution

@return float                                   The Spectral G-Index
"""
def spectral_g_index(spd):
    photopic_spd = get_photopic_curve()

    # numerator: sum spectral values from 380 to 500 nm
    numer = 0.0
    for i in range(380,501):
        numer += spd[i] 

    # demoninator: sum spectral values from 380 to 780 nm * the luminosity function
    denom = 0.0
    for i in range(380,781):
        denom += spd[i] * photopic_spd[i]

    # # perform the overall calculation
    return -2.5 * log10(numer/denom)


"""
Calculates the melanopic response (used to compute melanopic ratio) for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to a 1 decimal place

@return float                                   The melanopic response
"""
def melanopic_response(spd, toround=True):
    melanopic_spd = get_melanopic_curve()
    resp = np.sum(np.multiply(melanopic_spd.values, spd.values))
    return round_output(resp, toround, 1)


"""
Calculates the melanopic ratio for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to 2 decimal places

@return float                                   The melanopic ratio
"""
def melanopic_ratio(spd, toround=True):
    return round_output(melanopic_response(spd, False) / photopic_response(spd, False) * 1.218, toround)


"""
Calculates the M/P ratio for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to 2 decimal places

@return float                                   The M/P ratio
"""
def melanopic_photopic_ratio(spd, toround=True):
    return round_output(melanopic_response(spd, False) / photopic_response(spd, False), toround)


"""
Calculates melanopic lumens for a given light source

@param SpectralPowerDistribution/float input    If SPD, calculates the melanopic ratio. 
                                                If float, assumes the melanopic ratio is already provided.
@param int/float lumens                         The lumens of the light source
@param bool toround [optional]                  Whether to round to output to a whole number

@return int/float                               The melanopic lumens result
"""
def melanopic_lumens(input, lumens, toround=True):
    if type(input) == SpectralPowerDistribution:
        # SPD given, calculate the melanopic ratio
        mel_ratio = melanopic_ratio(input, toround=False)
    else:
        # Input is already the melanopic ratio
        mel_ratio = input

    return round_output(mel_ratio * lumens, toround, digits=None)
 