"""
Tools for importing and processing Spectral Power Distributions
"""
import csv
from colour import SpectralDistribution, SpectralShape
from .photometer import uprtek_import_spectrum
from os import listdir
from os.path import isfile, join

reference_spectra = []


"""Imports a spectral CSV data file and outputs a dictionary with the intensities for each wavelength

Parameters
----------
filename : String
    The filename to import
    
Returns
-------
dict
    A dictionary with the wavelengths and intensities, e.g.:
                                    {380: 0.048, 381: 0.051, ...}
"""
def import_spectral_csv(filename):
    spd = {}
    
    with open(filename, mode='r', encoding='utf-8-sig') as csvFile:
        reader = csv.reader(csvFile, delimiter=',')

        for count, row in enumerate(reader):
            spd[int(row[0])] = float(row[1])

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
    return SpectralDistribution(spd_dict, name=spd_name)


"""
Imports reference SPDs from the database

@param string filename              CSV file that serves as the SPD database
"""
def import_reference_spectra(filename='source_illuminants.csv'):
    global reference_spectra

    import os
    os.chdir(os.path.dirname(__file__))
    # print(os.getcwd())

    with open(filename, mode='r', encoding='utf-8-sig') as csvFile:
        reader = csv.reader(csvFile, delimiter=',')

        wavelengths = next(reader)[4:]

        for count, row in enumerate(reader):
            # extract data from the row
            name = row[0]
            description = row[1]
            spd = row[4:]

            # create the SPD dict
            spd_dict = {} 
            for i, val in enumerate(spd):
                if val != '':
                    spd_dict[int(wavelengths[i])] = float(val)
            spd_dict = normalize_spd(spd_dict)

            # create the SpectralPowerDistribution
            colour_spd = create_colour_spd(spd_dict, description)
            colour_spd = reshape(colour_spd)

            # prepare the dict to add to reference illuminants
            out_dict = {}
            out_dict['curve'] = colour_spd
            out_dict['name'] = name
            out_dict['description'] = description
            out_dict['normalized'] = True
            out_dict['weight'] = 1.0
            reference_spectra.append(out_dict)


"""
The getter for reference spectra (such as CIE-A, L-Cone, PAR)

@param String name      The name of the spectrum

@return dict            The reference spectrum
"""
def get_reference_spectrum(name):
    # if not initialized, first import the spectra into memory
    if not reference_spectra:
        import_reference_spectra()
    
    # then find the spectrum
    for spectrum in reference_spectra:
        if spectrum['name'] == name:
            return spectrum


"""
Reshapes the SPD by extending it to [360,780] and increasing the resolution to 1 nm

@param SpectralPowerDistribution spd    The SPD to reshape
@param int min [optional]               The minimum wavelength to extend to
@param int max [optional]               The maximum wavelength to extend to
@param int interval [optional]          The nm interval to specify

@return SpectralPowerDistribution       The reshaped SPD
"""
def reshape(spd, min=360, max=780, interval=1):
    spd = spd.extrapolate(SpectralShape(start=min, end=max, interval=interval))
    spd = spd.interpolate(SpectralShape(start=min, end=max, interval=interval))
    return spd


"""Imports a spectral data file and creates a named SPD usable by the Colour library

Parameters
----------
filename : String
    The filename to import
spd_name : String or None
    The name of the SPD. If None, the name will match the filename, minus the extension
weight : float
    A multplier to help normalize the spectral data
normalize : bool
    If True, normalize the spectrum to [0,1]
photometer : String or None
    If specified, imports a data file specific to that meter brand/model. Current options are: uprtek
    If None, file must be a CSV in the format [nm, intensity] with no header data
    
Returns
-------
SpectralPowerDistribution
    The SPD as an object usable by the Colour library
"""
def import_spd(filename, spd_name=None, weight=1.0, normalize=False, photometer=None):
    if photometer == 'uprtek':
        spd_dict = uprtek_import_spectrum(filename)
    else:
        spd_dict = import_spectral_csv(filename)

    if not spd_name:
        spd_name = filename.split(".")[-2].split('/')[-1]

    if normalize:
        spd_dict = normalize_spd(spd_dict)

    if weight != 1.0:
        spd_dict = weight_spd(spd_dict, weight)

    spd = create_colour_spd(spd_dict, spd_name)
    spd = reshape(spd)
    return spd


"""Imports an entire directory of SPD files to a dictionary

Note: for now, this only works in the top level of the directory
Note: All SPDs will be normalized, and the SPD name will match the file name minus the extension
Note: the data format should be the same for all files in the directory

Parameters
----------
directory : String
    The directory to import
photometer : String or None
    If specified, imports a data file specific to that meter brand/model. Current options are: uprtek
    If None, file must be a CSV in the format [nm, intensity] with no header data
printNames : bool
    If True, prints the names of all imported files
    
Returns
-------
dict
    A dict of SpectralPowerDistribution data
"""
def import_spd_batch(directory: str, photometer=None, printNames=True):
    spds = {}
    files = [f for f in listdir(directory) if isfile(join(directory, f)) if not f.startswith('.')]

    for file in files:
        spd = import_spd(directory + file, normalize=True, photometer=photometer)
        spds[spd.name] = spd

    if printNames:
        print('Imported the following SPDs:')
        for k in spds.keys():
            print(k)

    return spds
        