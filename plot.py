import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors
from colour import SpectralPowerDistribution

# for testing:
from spectrum import import_spd

"""
Converts a wavelength to an RGB color value for plotting
Based on code here:  http://www.physics.sfasu.edu/astro/color/spectra.html
and here: https://stackoverflow.com/a/44960748/10725740

@param int/float wavelength     The wavelength, in nm
@param float gamma              

@return tuple                   The (R,G,B,A) value
"""
def wavelength_to_rgb(wavelength, gamma=0.8):
    wavelength = float(wavelength)
    if wavelength >= 360 and wavelength <= 780:
        A = 1.
    else:
        A=0.5
    if wavelength < 380:
        wavelength = 380.
    if wavelength >750:
        wavelength = 750.
    if wavelength >= 380 and wavelength <= 440:
        attenuation = 0.3 + 0.7 * (wavelength - 380) / (440 - 380)
        R = ((-(wavelength - 440) / (440 - 380)) * attenuation) ** gamma
        G = 0.0
        B = (1.0 * attenuation) ** gamma
    elif wavelength >= 440 and wavelength <= 490:
        R = 0.0
        G = ((wavelength - 440) / (490 - 440)) ** gamma
        B = 1.0
    elif wavelength >= 490 and wavelength <= 510:
        R = 0.0
        G = 1.0
        B = (-(wavelength - 510) / (510 - 490)) ** gamma
    elif wavelength >= 510 and wavelength <= 580:
        R = ((wavelength - 510) / (580 - 510)) ** gamma
        G = 1.0
        B = 0.0
    elif wavelength >= 580 and wavelength <= 645:
        R = 1.0
        G = (-(wavelength - 645) / (645 - 580)) ** gamma
        B = 0.0
    elif wavelength >= 645 and wavelength <= 750:
        attenuation = 0.3 + 0.7 * (750 - wavelength) / (750 - 645)
        R = (1.0 * attenuation) ** gamma
        G = 0.0
        B = 0.0
    else:
        R = 0.0
        G = 0.0
        B = 0.0
    return (R,G,B,A)


"""
Plots a color spectrum

@param SpectralPowerDistribution spd        The SPD
@param int/float xsize [optional]           The width of the plotted figure
@param int/float ysize [optional]           The height of the plotted figure
@param string filename [optional]           If specified, will save plot as the specified filename
@param string ylabel [optional]             If specified, this will replace 'Intensity' on the y axis
@param bool supress [optional]              If True, the plot will not be shown
"""
def plot_spectrum(spd, xsize=8, ysize=4, filename=None, ylabel='Intensity', suppress=False):
    clim=(360,780)
    norm = plt.Normalize(*clim)
    wl = np.arange(clim[0],clim[1]+1,2)
    colorlist = list(zip(norm(wl),[wavelength_to_rgb(w) for w in wl]))
    spectralmap = matplotlib.colors.LinearSegmentedColormap.from_list("spectrum", colorlist)

    fig, axs = plt.subplots(1, 1, figsize=(xsize,ysize), tight_layout=True)

    wavelengths = spd.wavelengths
    values = spd.values
    plt.plot(wavelengths, values, linestyle='None')

    y = np.linspace(0, max(values), 100)
    X,Y = np.meshgrid(wavelengths, y)

    extent=(np.min(wavelengths), np.max(wavelengths), 0, np.max(values))

    plt.imshow(X, clim=clim,  extent=extent, cmap=spectralmap, aspect='auto')
    plt.xlabel('Wavelength (nm)')
    plt.ylabel(ylabel)

    plt.fill_between(wavelengths, values, np.max(values), color='w')
    
    if filename:
        plt.savefig(filename, dpi=300)

    if not suppress:
        plt.show()


# for testing
spd = import_spd('CSVs/test_spd.csv', 'test', weight=0.9, normalize=True)
plot_spectrum(spd)
