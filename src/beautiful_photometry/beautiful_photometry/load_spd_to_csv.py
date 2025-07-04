"""
This script is used to load spectral data files (CSVs) into a basic spectral database, for example source_illuminants.csv

The script is run as follows:
python load_spd_to_csv.py target_database.csv file_to_import.csv name

For example:
python load_spd_to_csv.py source_illuminants.csv CSVs/melanopic_spd.csv Melanopic
"""
import sys
import csv

from .spectrum import import_spectral_csv

"""
Gets the column names of the target database

@param String filename      The name of the target database

@return List                The column names of the target database
"""
def get_column_names(filename):
    with open(filename, mode='r', encoding='utf-8-sig') as csvFile:
        reader = csv.reader(csvFile, delimiter=',')

        columns = []

        for column in next(reader):
            columns.append(column)

        return columns


"""
Generates a CSV row that matches the column format of the target database

@param Dict spd             The SPD
@param List columns         The columns of the target database
@param String name          The name of the SPD to insert

@return List                The SPD parsed to match the column format
"""
def parse_spd_to_match_db(spd, columns, name):
    new_spd = [None] * len(columns)

    # Insert the name
    name_col = columns.index('Name')
    new_spd.insert(name_col, name)

    # Insert the wavelengths
    for wl, value in spd.items():
        wl_col = columns.index(str(wl))
        new_spd.insert(wl_col, value)

    return new_spd


"""
Adds a line to a CSV file

@param String filename      The name of the target database
@param List row             The row to add
"""
def add_row_to_csv(filename, row):
    with open(filename, mode='a', encoding='utf-8-sig', newline='') as csvFile:
        writer = csv.writer(csvFile)
        writer.writerow(row)

    csvFile.close()


# Get passed in command line parameters
target_database = sys.argv[1]
file_to_import = sys.argv[2]
name = sys.argv[3]

# Parse the SPD and insert it into the database
spd = import_spectral_csv(file_to_import)
columns = get_column_names(target_database)
parsed_spd = parse_spd_to_match_db(spd, columns, name)
add_row_to_csv(target_database, parsed_spd)
