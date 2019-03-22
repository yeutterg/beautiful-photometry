"""
SPD Plotting Tools
"""
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors
from colour import SpectralPowerDistribution, SpectralShape
from .human_circadian import get_melanopic_curve

# for testing:
from .spectrum import import_spd

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
Generates a spectral map

@param tuple xlim [optional]        The (min,max) values for the x axis

@return LinearSegmentedColormap     The colormap
"""
def generate_color_spectrum(xlim=(360,780)):
    norm = plt.Normalize(*xlim)
    wl = np.arange(xlim[0],xlim[1]+1,1)
    colorlist = list(zip(norm(wl),[wavelength_to_rgb(w) for w in wl]))
    return matplotlib.colors.LinearSegmentedColormap.from_list("spectrum", colorlist)


"""
Plots a melanopic curve and/or melanopic stimulus for a given SPD

@param axis ax                                      The axis on which to plot
@param bool melanopic_curve                         Display the melanopic sensitivity curve
@param bool melanopic_stimulus [optional]           Display the melanopic stimulus (sensitivity curve * SPD)
@param SpectralPowerDistribution spd [optional]     The SPD (needed if melanopic_stimulus=True)
"""
def plot_melanopic_curve(ax, melanopic_curve, melanopic_stimulus=False, spd=None):
    if melanopic_curve or melanopic_stimulus:
        melanopic_spd = get_melanopic_curve()

        # plot normalized melanopic curve
        if melanopic_curve:
            mel_wavelengths = melanopic_spd.wavelengths
            mel_values = melanopic_spd.values
            ax.fill(mel_wavelengths, mel_values, facecolor='gray', alpha=0.2)

        # plot melanopic stimulus of the SPD in question
        if melanopic_stimulus and spd is not None:
            mel_spd_2 = melanopic_spd.copy()
            spd_2 = spd.copy()
            mel_stimulus = np.multiply(mel_spd_2.values, spd_2.values)
            ax.plot(mel_spd_2.wavelengths, mel_stimulus, color='white', linewidth=0.2)
            ax.fill(mel_spd_2.wavelengths, mel_stimulus, facecolor='white', alpha=0.2)


"""
Plots a single SPD color spectrum

@param SpectralPowerDistribution spd        The SPD
@param tuple figsize [optional]             The (width,height) of the plotted figure
@param string filename [optional]           If specified, will save plot as the specified filename
@param string ylabel [optional]             If specified, this will replace 'Intensity' on the y axis
@param bool hideyaxis [optional]            If True, the y axis will not be shown
@param bool supress [optional]              If True, the plot will not be shown
@param tuple xlim [optional]                The (min,max) values for the x axis
@param int xtick [optional]                 The x axis tick spacing
@param int/float ytick [optional]           The y axis tick spacing
@param bool melanopic_curve [optional]      Display the melanopic sensitivity curve
@param bool melanopic_stimulus [optional]   Display the melanopic stimulus (sensitivity curve * SPD)
"""
def plot_spectrum(
        spd, figsize=(8,4), filename=None, ylabel='Intensity', hideyaxis=False, suppress=False, 
        xlim=(360,780), xtick=30, ytick=0.2, melanopic_curve=False, melanopic_stimulus=False
    ):
    # create the subplot
    fig, ax = plt.subplots(1, 1, figsize=figsize, tight_layout=True)

    # get the SPD values and plot
    wavelengths = spd.wavelengths
    values = spd.values
    plt.plot(wavelengths, values, linestyle='None')

    # plot melanopic curve
    plot_melanopic_curve(ax, melanopic_curve, melanopic_stimulus, spd)

    # define the plot area coordinates
    y = np.linspace(0, max(values), 100)
    X,Y = np.meshgrid(wavelengths, y)
    extent=(np.min(wavelengths), np.max(wavelengths), 0, np.max(values))

    # generate the color spectrum
    spectralmap = generate_color_spectrum(xlim)

    # show the image and axis labels
    plt.imshow(X, clim=xlim,  extent=extent, cmap=spectralmap, aspect='auto')
    plt.xlabel('Wavelength (nm)')
    plt.ylabel(ylabel)

    # fill the plot with whitespace
    plt.fill_between(wavelengths, values, np.max(values), color='w')

    # plot dots to display values at beginning and end of x axis
    plt.plot(xlim[0], 0, linestyle='None')
    plt.plot(xlim[1], 0, linestyle='None')

    # set the axis ticks
    plt.xticks(np.arange(xlim[0], xlim[1]+1, xtick))
    if hideyaxis:
        ax.spines['left'].set_color('none')
        plt.gca().axes.get_yaxis().set_visible(False)
    else:
        plt.yticks(np.arange(0.0, np.max(values)+ytick, ytick))

    # change the style of the axis spines
    ax.spines['top'].set_color('none')
    ax.spines['right'].set_color('none')
    ax.spines['left'].set_smart_bounds(True)
    ax.spines['bottom'].set_smart_bounds(True)
    
    # save the figure if a filename was specified
    if filename:
        plt.savefig(filename, dpi=300)

    # show the plot
    if not suppress:
        plt.show()


"""
Plots multiple SPDs

@param SpectralPowerDistribution spds       The SPDs
@param tuple figsize [optional]             The (width,height) of the plotted figure
@param string filename [optional]           If specified, will save plot as the specified filename
@param string ylabel [optional]             If specified, this will replace 'Intensity' on the y axis
@param bool hideyaxis [optional]            If True, the y axis will not be shown
@param bool supress [optional]              If True, the plot will not be shown
@param tuple xlim [optional]                The (min,max) values for the x axis
@param int xtick [optional]                 The x axis tick spacing
@param int/float ytick [optional]           The y axis tick spacing
@param bool melanopic_curve [optional]      Display the melanopic sensitivity curve
@param bool colorbar [optional]             Display the color reference bar
@param bool showlegend [optional]           Display the legend
@param string legend_loc [optional]         The legend location. Default is 'upper left'
                                            Possible values: 'best', 'upper right', 'upper left', 'lower left', 
                                                            'lower right', 'right', 'center left', 'center right',
                                                            'lower center', 'upper center', 'center'
"""
def plot_multi_spectrum(
        spds, figsize=(8,4), filename=None, ylabel='Intensity', hideyaxis=False, suppress=False, 
        xlim=(360,780), xtick=30, ytick=0.2, melanopic_curve=False,
        colorbar=True, showlegend=True, legend_loc='upper left'
    ):
    # TODO fix non-colorbar display

    # create the figure
    fig, (ax0, ax1) = plt.subplots(2, 1, figsize=figsize, tight_layout=True, sharex=True, gridspec_kw={'height_ratios':[8,1], 'hspace':0})
    wavelengths = np.arange(xlim[0], xlim[1]+1)

    # plot the color bar
    if colorbar:
        # define the plot area coordinates
        y = [0, 1]
        X,Y = np.meshgrid(wavelengths, y)
        extent=(np.min(wavelengths), np.max(wavelengths), 0, 1)

        # generate the color spectrum
        spectralmap = generate_color_spectrum(xlim)

        # show the image and hide the left axis
        plt.imshow(X, clim=xlim,  extent=extent, cmap=spectralmap, aspect='auto')
        ax1.spines['left'].set_color('none')
        ax1.spines['top'].set_color('none')
        ax1.spines['right'].set_color('none')
        ax1.spines['bottom'].set_smart_bounds(True)
        ax1.yaxis.set_visible(False)
        ax1.tick_params(top=False, left=False, right=False, bottom=True)
        ax1.set_ylim(-0.5,1)

    # get the SPD values and plot
    legend_vals = []
    for spd in spds:    
        values = spd.values
        spd_wls = spd.wavelengths

        # resize values array if it is shorter than wavelengths array
        add_len = len(wavelengths) - len(values)
        if add_len > 0:
            values = np.pad(values, (0,add_len), 'constant')

        # remove values outside xlim
        elif add_len < 0:
            arr_start = np.argwhere(spd_wls == xlim[0])[0][0]
            arr_end = np.argwhere(spd_wls == xlim[1])[0][0]
            values = values[arr_start:arr_end+1]

        legend_vals.append(spd.strict_name)
        ax0.plot(wavelengths, values)

    # show the legend
    if showlegend:
        ax0.legend(legend_vals, loc=legend_loc)

    # plot melanopic curve
    plot_melanopic_curve(ax0, melanopic_curve)

    # label the axes
    plt.xlabel('Wavelength (nm)')

    # set the axis ticks
    plt.xticks(np.arange(xlim[0], xlim[1]+1, xtick))
    ax0.tick_params(bottom=False)
    ax0.xaxis.set_visible(False)
    if hideyaxis:
        ax0.spines['left'].set_color('none')
        ax0.yaxis.set_visible(False)
    else:
        plt.yticks(np.arange(0.0, np.max(values)+ytick, ytick))
        ax0.set_ylabel(ylabel)

    # change the style of the axis spines
    ax0.spines['top'].set_color('none')
    ax0.spines['right'].set_color('none')
    ax0.spines['left'].set_smart_bounds(True)
    ax0.spines['bottom'].set_color('none')
    
    # save the figure if a filename was specified
    if filename:
        plt.savefig(filename, dpi=300)

    # show the plot
    if not suppress:
        plt.show()


# for testing
# spd = import_spd('CSVs/test_spd.csv', 'test', weight=0.9, normalize=True)
# spd_2 = import_spd('CSVs/incandescent.csv', 'Incandescent', normalize=True)
# plot_spectrum(spd, hideyaxis=True, melanopic_curve=True, melanopic_stimulus=True)
# plot_multi_spectrum([spd, spd_2], melanopic_curve=True, hideyaxis=True)
