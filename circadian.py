from spectrum import import_spd

"""
Gets the melanopic sensitivity curve

@param bool normalize [optional]        If False, curve will not be normalized to [0,1]
@param float weight [optional]          The multiplier to apply to the curve

@return SpectralPowerDistribution       The melanopic SPD
"""
def get_melanopic_curve(normalize=True, weight=1.0):
    return import_spd('CSVs/melanopic_spd.csv', 'Melanopic Curve', normalize=normalize, weight=weight)


"""
Gets the visual sensitivity curve

@param bool normalize [optional]        If False, curve will not be normalized to [0,1]
@param float weight [optional]          The multiplier to apply to the curve

@return SpectralPowerDistribution       The visual SPD
"""
def get_visual_curve(normalize=True, weight=1.0):
    return import_spd('CSVs/visual_spd.csv', 'Visual Curve', normalize=normalize, weight=weight)