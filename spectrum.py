import csv
from colour import SpectralPowerDistribution, SpectralShape

"""
Imports a CSV and outputs a dictionary with the intensities for each wavelength


@param string filename              CSV file with wavelengths in the first column, intensities in the second. No header data.
@param float weight [optional]      A multplier to help normalize the spectral data
@param bool normalize [optional]    normalize the spectrum to [0,1]

@return dict                        A dictionary with the wavelengths and intensities, e.g.:
                                    {380: 0.048, 381: 0.051, ...}
"""
def import_spectral_csv(filename, weight=1.0, normalize=False):
    spd = {}

    with open(filename, mode='r', encoding='utf-8-sig') as csvFile:
        reader = csv.reader(csvFile, delimiter=',')

        for count, row in enumerate(reader):
            spd[int(row[0])] = float(row[1])

    if normalize:
        spd = normalize_spd(spd)

    if weight is not 1.0:
        spd = weight_spd(spd, weight)

    return spd


"""
Normalizes an SPD to [0,1]

@param dict spd     The SPD dictionary

@return dict        The normalized SPD
"""
def normalize_spd(spd):
    maximum = max(spd.values())
    for i in spd:
        spd[i] = spd[i] / maximum
    return spd


"""
Weights an SPD

@param dict spd         The SPD dictionary
@param float weight     The weight to apply

@return dict            The weighted SPD
"""
def weight_spd(spd, weight):
    for i in spd:
        spd[i] = spd[i] * weight
    return spd


"""
Creates a named SPD usable by the Colour library

@param dict spd_dict                The SPD as a dictionary
@param string spd_name:             The name of the SPD

@return SpectralPowerDistribution   The SPD as an object usable by the Colour library
"""
def create_colour_spd(spd_dict, spd_name):
    return SpectralPowerDistribution(spd_dict, name=spd_name)


"""
Reshapes the SPD by extending it to [360,780] and increasing the resolution to 1 nm

@param SpectralPowerDistribution spd    The SPD to reshape
@param int min [optional]               The minimum wavelength to extend to
@param int max [optional]               The maximum wavelength to extend to
@param int interval [optional]          The nm interval to specify

@return SpectralPowerDistribution       The reshaped SPD
"""
def reshape(spd, min=360, max=780, interval=1):
    spd = spd.extrapolate(SpectralShape(start=min, end=max))
    spd = spd.interpolate(SpectralShape(interval=interval))
    return spd


"""
Imports a spectral CSV and creates a named SPD usable by the Colour library

@param string filename              CSV file with wavelengths in the first column, intensities in the second. No header data.
@param string spd_name              The name of the SPD
@param float weight [optional]      A multplier to help normalize the spectral data
@param bool normalize [optional]    Normalize the spectrum to [0,1]

@return SpectralPowerDistribution   The SPD as an object usable by the Colour library
"""
def import_spd(filename, spd_name, weight=1.0, normalize=False):
    spd_dict = import_spectral_csv(filename, weight, normalize)
    spd = create_colour_spd(spd_dict, spd_name)
    spd = reshape(spd)
    return spd


# debug
# spd = import_spd('CSVs/test_spd.csv', 'test', weight=0.9, normalize=True)
# print(spd)
        