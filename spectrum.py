import csv
import colour

# Imports a CSV and outputs a dictionary with the intensities for each wavelength
#
# Input: 
#     filename: CSV file with wavelengths in the first column, intensities in the second. No header data.
# Returns: A dictionary with the wavelengths and intensities, e.g.:
# {380: 0.048, 381: 0.051, ...}
def import_spectral_csv(filename):
    spd = {}

    with open(filename) as csvFile:
        reader = csv.reader(csvFile, delimiter=',')

        for count, row in enumerate(reader):
            spd[int(row[0])] = float(row[1])

    return spd

# Creates a named SPD usable by the Colour library
#
# Input: 
#     spd_dict: The SPD as a dictionary
#     spd_name: The name of the SPD
# Returns: The SPD as an object usable by the Colour library
def create_colour_spd(spd_dict, spd_name):
    return colour.SpectralPowerDistribution(spd_dict, name=spd_name)

# Imports a spectral CSV and creates a named SPD usable by the Colour library
#
# Input:
#     filename: CSV file with wavelengths in the first column, intensities in the second. No header data.
#     spd_name: The name of the SPD
# Returns: The SPD as an object usable by the Colour library
def import_spd(filename, spd_name):
    spd_dict = import_spectral_csv(filename)
    return create_colour_spd(spd_dict, spd_name)
        