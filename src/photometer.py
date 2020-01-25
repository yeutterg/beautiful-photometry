"""Photometer

These functions handle data files from spectrophotometers for easy and direct import

The functions are:

    * uprtek_import_spectrum - Imports the spectrum from a UPRtek spectrophotometer
"""

import csv
import itertools


"""Imports a UPRtek data file and outputs a dictionary with the intensities for each wavelength

Note: UPRtek names these files as .xls, but they are actually formatted as tab-delimited text files
Note2: This has only been tested with the UPRtek CV600

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
def uprtek_import_spectrum(filename: str):
    # Note: tested only with the UPRtek CV600
    spd = {}

    with open(filename, mode='r', encoding='us-ascii') as csvFile:
        reader = csv.reader(csvFile, delimiter='\t')

        for row in itertools.islice(reader, 40, None):
            spd[int(row[0][0:3])] = float(row[1])

    return spd


"""Imports a UPRtek data file and outputs a dictionary with the R-Values

Note: UPRtek names these files as .xls, but they are actually formatted as tab-delimited text files
Note2: This has only been tested with the UPRtek CV600

Parameters
----------
filename : String
    The filename to import
    
Returns
-------
dict
    A dictionary with the R-Values, e.g.:
                                    {'R1': 98.887482, 'R2': 99.234245, ...}
"""
def uprtek_import_r_vals(filename: str):
    # Note: tested only with the UPRtek CV600
    r_vals = {}

    with open(filename, mode='r', encoding='us-ascii') as csvFile:
        reader = csv.reader(csvFile, delimiter='\t')

        for row in itertools.islice(reader, 19, 34):
            r_vals[row[0]] = float(row[1])

    print(r_vals)

    return r_vals
