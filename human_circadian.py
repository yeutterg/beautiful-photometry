from spectrum import import_spd
from utils import round_output
from colour import SpectralPowerDistribution
import numpy as np

melanopic_curve = {'curve': None, 'normalized': True, 'weight': 1.0}
scotopic_curve = {'curve': None, 'normalized': True, 'weight': 1.0}
photopic_curve = {'curve': None, 'normalized': True, 'weight': 1.0}

"""
Gets the melanopic sensitivity curve

@param bool normalize [optional]        If False, curve will not be normalized to [0,1]
@param float weight [optional]          The multiplier to apply to the curve

@return SpectralPowerDistribution       The melanopic SPD
"""
def get_melanopic_curve(normalize=True, weight=1.0):
    if melanopic_curve['curve'] is None or melanopic_curve['normalized'] != normalize or melanopic_curve['weight'] != weight:
        melanopic_curve['curve'] = import_spd('CSVs/melanopic_spd.csv', 'Melanopic Curve', normalize=normalize, weight=weight)
        melanopic_curve['normalized'] = normalize
        melanopic_curve['weight'] = weight

    return melanopic_curve['curve']


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
Calculates the melanopic ratio for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to 2 decimal places

@return float                                   The melanopic ratio
"""
def melanopic_ratio(spd, toround=True):
    return round_output(melanopic_response(spd, False) / photopic_response(spd, False) * 1.218, toround)


"""
Calculates the S/P ratio for a given light source

@param SpectralPowerDistribution spd            The spectral power distribution
@param bool toround [optional]                  Whether to round to output to 2 decimal places

@return float                                   The S/P ratio
"""
def scotopic_photopic_ratio(spd, toround=True):
    return round_output(scotopic_response(spd, False) / photopic_response(spd, False), toround)


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
 