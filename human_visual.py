import numpy as np

from spectrum import import_spd
from utils import round_output
from colour import SpectralPowerDistribution

scotopic_curve = {'curve': None, 'normalized': True, 'weight': 1.0}
photopic_curve = {'curve': None, 'normalized': True, 'weight': 1.0}

"""
Gets the scotopic sensitivity curve

Note: Using the CIE 1951 Scotopic Luminosity Curve
Source: https://web.archive.org/web/20081228115119/http://www.cvrl.org/database/text/lum/scvl.htm

@param bool normalize [optional]        If False, curve will not be normalized to [0,1]
@param float weight [optional]          The multiplier to apply to the curve

@return SpectralPowerDistribution       The scotopic SPD
"""
def get_scotopic_curve(normalize=True, weight=1.0):
    if scotopic_curve['curve'] is None or scotopic_curve['normalized'] != normalize or scotopic_curve['weight'] != weight:
        scotopic_curve['curve'] = import_spd('CSVs/scotopic_spd.csv', 'Scotopic Curve', normalize=normalize, weight=weight)
        scotopic_curve['normalized'] = normalize
        scotopic_curve['weight'] = weight

    return scotopic_curve['curve']


"""
Gets the photopic (daytime visual) sensitivity curve

Note: Using the Judd-Vos modified CIE 2-deg photopic luminosity curve from 1978
Source: https://web.archive.org/web/20081228083025/http://www.cvrl.org/database/text/lum/vljv.htm

@param bool normalize [optional]        If False, curve will not be normalized to [0,1]
@param float weight [optional]          The multiplier to apply to the curve

@return SpectralPowerDistribution       The photopic SPD
"""
def get_photopic_curve(normalize=True, weight=1.0):
    if photopic_curve['curve'] is None or photopic_curve['normalized'] != normalize or photopic_curve['weight'] != weight:
        photopic_curve['curve'] = import_spd('CSVs/photopic_spd.csv', 'Photopic Curve', normalize=normalize, weight=weight)
        photopic_curve['normalized'] = normalize
        photopic_curve['weight'] = weight

    return photopic_curve['curve']


"""
Calculates the visual/photopic response for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to a 1 decimal place

@return float                                   The photopic response
"""
def photopic_response(spd, toround=True):
    photopic_spd = get_photopic_curve()
    resp = np.sum(np.multiply(photopic_spd.values, spd.values))
    return round_output(resp, toround, 1)


"""
Calculates the scotopic (low-light visual) response for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to a 1 decimal place

@return float                                   The scotopic response
"""
def scotopic_response(spd, toround=True):
    scotopic_spd = get_scotopic_curve()
    resp = np.sum(np.multiply(scotopic_spd.values, spd.values))
    return round_output(resp, toround, 1)


"""
Calculates the S/P ratio for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to 2 decimal places

@return float                                   The S/P ratio
"""
def scotopic_photopic_ratio(spd, toround=True):
    return round_output(scotopic_response(spd, False) / photopic_response(spd, False), toround)
