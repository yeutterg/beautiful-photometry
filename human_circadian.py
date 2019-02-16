import numpy as np

from spectrum import import_spd
from utils import round_output
from colour import SpectralPowerDistribution
from human_visual import photopic_response

melanopic_curve = {'curve': None, 'normalized': True, 'weight': 1.0}

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
 