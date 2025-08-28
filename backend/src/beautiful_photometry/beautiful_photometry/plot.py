"""
SPD Plotting Tools
"""
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors
from colour import SpectralDistribution, SpectralShape
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
    A = 1.0  # Always full alpha for consistent appearance
    
    # Handle wavelengths outside visible spectrum
    if wavelength < 380:
        # UV - use same color as 380nm to avoid discontinuity
        wavelength = 380  # Process as 380nm
    
    if wavelength > 780:
        # IR - use deep red
        R = 0.5
        G = 0.0
        B = 0.0
    elif wavelength >= 380 and wavelength <= 440:
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
    elif wavelength >= 645 and wavelength <= 780:
        attenuation = 0.3 + 0.7 * (780 - wavelength) / (780 - 645)
        R = (1.0 * attenuation) ** gamma
        G = 0.0
        B = 0.0
        # At 780nm, this gives a deep red with R≈0.3
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
            ax.fill(mel_wavelengths, mel_values, facecolor='gray', alpha=0.3, zorder=3)

        # plot melanopic stimulus of the SPD in question
        if melanopic_stimulus and spd is not None:
            # Align the wavelengths between melanopic curve and SPD
            # Find common wavelength range
            mel_wavelengths = np.array(melanopic_spd.wavelengths)
            spd_wavelengths = np.array(spd.wavelengths)
            mel_values = np.array(melanopic_spd.values)
            spd_values = np.array(spd.values)
            
            # Ensure wavelengths are sorted
            mel_sorted_idx = np.argsort(mel_wavelengths)
            mel_wavelengths = mel_wavelengths[mel_sorted_idx]
            mel_values = mel_values[mel_sorted_idx]
            
            spd_sorted_idx = np.argsort(spd_wavelengths)
            spd_wavelengths = spd_wavelengths[spd_sorted_idx]
            spd_values = spd_values[spd_sorted_idx]
            
            # Get the overlapping range
            min_wavelength = max(np.min(mel_wavelengths), np.min(spd_wavelengths))
            max_wavelength = min(np.max(mel_wavelengths), np.max(spd_wavelengths))
            
            # Create aligned arrays for the overlapping range
            common_wavelengths = np.arange(int(min_wavelength), int(max_wavelength) + 1)
            
            # Interpolate both curves to common wavelengths
            mel_interp = np.interp(common_wavelengths, mel_wavelengths, mel_values)
            spd_interp = np.interp(common_wavelengths, spd_wavelengths, spd_values)
            
            # Calculate stimulus
            mel_stimulus = np.multiply(mel_interp, spd_interp)
            
            ax.plot(common_wavelengths, mel_stimulus, color='white', linewidth=0.2, zorder=3)
            ax.fill(common_wavelengths, mel_stimulus, facecolor='white', alpha=0.2, zorder=3)


"""
Plots a single SPD color spectrum

@param SpectralPowerDistribution spd        The SPD
@param tuple figsize [optional]             The (width,height) of the plotted figure
@param string filename [optional]           If specified, will save plot as the specified filename
@param string ylabel [optional]             If specified, this will replace 'Intensity' on the y axis
@param bool hideyaxis [optional]            If True, the y axis will not be shown
@param string title [optional]              If not None, display the specified title text
@param bool supress [optional]              If True, the plot will not be shown
@param tuple xlim [optional]                The (min,max) values for the x axis
@param int xtick [optional]                 The x axis tick spacing
@param int/float ytick [optional]           The y axis tick spacing
@param bool melanopic_curve [optional]      Display the melanopic sensitivity curve
@param bool melanopic_stimulus [optional]   Display the melanopic stimulus (sensitivity curve * SPD)
"""
def plot_spectrum(
        spd, figsize=(8,4), filename=None, ylabel='Intensity', hideyaxis=False, suppress=False, title=None,
        xlim=None, xtick=30, ytick=0.2, melanopic_curve=False, melanopic_stimulus=False, show_legend=True,
        show_spectral_ranges=False
    ):
    # create the subplot with white background
    fig, ax = plt.subplots(1, 1, figsize=figsize, tight_layout=True, facecolor='white')
    ax.set_facecolor('white')

    # get the SPD values and plot
    wavelengths = spd.wavelengths
    values = spd.values
    
    # If xlim not specified, use the data range
    if xlim is None:
        xlim = (int(np.min(wavelengths)), int(np.max(wavelengths)))
    
    # Generate the full spectrum including infrared region
    y_max = max(1.0, max(values) * 1.05)
    y_full = np.linspace(0, y_max, 100)
    
    # For visible spectrum (up to 780nm)
    visible_max = min(780, xlim[1])
    
    # Create wavelength range starting slightly after xlim[0] to avoid edge artifacts
    # This prevents the spectrum from bleeding into the axis area
    spectrum_start = xlim[0] + 0.5  # Start half a unit after xlim[0]
    visible_wavelengths = np.arange(spectrum_start, visible_max+1)
    
    if len(visible_wavelengths) > 0:
        X_visible, Y_visible = np.meshgrid(visible_wavelengths, y_full)
        # Keep the extent starting at the actual xlim
        extent_visible = (spectrum_start, visible_max, 0, y_max)
        
        # Generate color spectrum - ensure we have a proper range
        # Use 360-780 for color generation to ensure proper colors
        color_range = (min(360, xlim[0]), visible_max)
        spectralmap = generate_color_spectrum(color_range)
        
        # Show the color spectrum in visible range
        # The small offset prevents rendering artifacts at the boundary
        plt.imshow(X_visible, clim=(spectrum_start, visible_max), extent=extent_visible, 
                   cmap=spectralmap, aspect='auto', alpha=1.0, zorder=1, 
                   interpolation='bilinear', origin='lower')
    
    # If spectrum extends beyond 780nm, fade from deep red to black
    if xlim[1] > 780:
        ir_start = max(780, xlim[0])
        ir_wavelengths = np.arange(ir_start, xlim[1]+1)
        
        if len(ir_wavelengths) > 0:
            X_ir, Y_ir = np.meshgrid(ir_wavelengths, y_full)
            extent_ir = (ir_start, xlim[1], 0, y_max)
            
            # Get the color at 780nm (deep red) from wavelength_to_rgb
            red_780 = wavelength_to_rgb(780, gamma=0.8)[:3]  # Get RGB at 780nm
            
            # Create a gradient from red at 780nm to black at 2000nm
            ir_colors = np.zeros((100, len(ir_wavelengths), 3))
            
            for i, wavelength in enumerate(ir_wavelengths):
                # Calculate fade factor (1.0 at 780nm, 0.0 at 2000nm)
                if wavelength <= 2000:
                    fade = 1.0 - (wavelength - 780) / (2000 - 780)
                else:
                    fade = 0.0  # Complete black beyond 2000nm
                
                # Apply fade to the red color
                ir_colors[:, i, 0] = red_780[0] * fade  # Red channel
                ir_colors[:, i, 1] = red_780[1] * fade  # Green channel (should be 0)
                ir_colors[:, i, 2] = red_780[2] * fade  # Blue channel (should be 0)
            
            # Display the infrared region with gradient from red to black
            plt.imshow(ir_colors, extent=extent_ir, aspect='auto', alpha=1.0, zorder=1)
    
    # Fill above the SPD curve with white to hide spectrum above curve (do this first)
    # Ensure we only fill where we have data to avoid artifacts
    valid_mask = ~np.isnan(values)
    if np.any(valid_mask):
        plt.fill_between(wavelengths[valid_mask], values[valid_mask], y_max, 
                         color='white', alpha=1.0, zorder=2, linewidth=0)
    
    # plot melanopic curve (on top of white background)
    if melanopic_curve or melanopic_stimulus:
        plot_melanopic_curve(ax, melanopic_curve, melanopic_stimulus, spd)
        if show_legend:
            # Add melanopic to legend
            plt.plot([], [], color='gray', alpha=0.5, linewidth=8, label='Melanopic Response')
    
    # Plot the SPD curve on top
    # Always plot the curve, use spd.name for legend label
    plt.plot(wavelengths, values, label=spd.name, linewidth=2, color='black', zorder=5)
    
    plt.xlabel('Wavelength (nm)')
    plt.ylabel(ylabel)

    # Set x-axis limits
    plt.xlim(xlim)
    # Y-axis from 0 to 1.0 (or slightly above max if values exceed 1.0)
    plt.ylim(0, max(1.0, max(values) * 1.05))

    # Set the axis ticks dynamically based on range
    x_range = xlim[1] - xlim[0]
    if x_range <= 400:
        xtick = 50  # Every 50nm for ranges up to 400nm
    else:
        xtick = 100  # Every 100nm for larger ranges
    
    # Generate tick positions
    # Start from a round number
    start_tick = (xlim[0] // xtick) * xtick
    if start_tick < xlim[0]:
        start_tick += xtick
    
    tick_positions = list(range(start_tick, xlim[1], xtick))
    
    # Always include the first and last values
    if xlim[0] not in tick_positions:
        tick_positions.insert(0, xlim[0])
    if xlim[1] not in tick_positions:
        tick_positions.append(xlim[1])
    
    # Sort and remove duplicates
    tick_positions = sorted(list(set(tick_positions)))
    
    plt.xticks(tick_positions)
    if hideyaxis:
        ax.spines['left'].set_color('none')
        plt.gca().axes.get_yaxis().set_visible(False)
    else:
        plt.yticks(np.arange(0.0, np.max(values)+ytick, ytick))

    # change the style of the axis spines
    ax.spines['top'].set_color('none')
    ax.spines['right'].set_color('none')
    # set_smart_bounds deprecated in newer matplotlib versions
    # ax.spines['left'].set_smart_bounds(True)
    # ax.spines['bottom'].set_smart_bounds(True)

    # show title
    if title:
        plt.title(title)
    
    # Show legend if requested
    if show_legend:
        plt.legend(loc='upper right')
    
    # Add spectral range labels as secondary x-axis
    if show_spectral_ranges:
        ax2 = ax.twiny()
        ax2.set_xlim(xlim)
        
        # Remove the box around the secondary axis
        ax2.spines['top'].set_visible(False)
        ax2.spines['left'].set_visible(False)
        ax2.spines['right'].set_visible(False)
        
        # Define spectral ranges
        ranges = [
            (280, 760, 'Visible'),
            (760, 1400, 'NIR'),
            (1400, 3000, 'SWIR')
        ]
        
        # Collect tick positions and labels
        tick_positions = []
        tick_labels = []
        
        for start, end, label in ranges:
            # Add ticks at range boundaries that are visible
            if start >= xlim[0] and start <= xlim[1]:
                tick_positions.append(start)
                tick_labels.append(str(start))
                # Add subtle vertical line
                ax.axvline(x=start, color='gray', linestyle=':', alpha=0.3, linewidth=0.5)
            
            if end >= xlim[0] and end <= xlim[1]:
                tick_positions.append(end)
                tick_labels.append(str(end))
                # Add subtle vertical line
                ax.axvline(x=end, color='gray', linestyle=':', alpha=0.3, linewidth=0.5)
            
            # Add range label in the middle
            if start < xlim[1] and end > xlim[0]:
                range_start = max(start, xlim[0])
                range_end = min(end, xlim[1])
                range_center = (range_start + range_end) / 2
                
                if (range_end - range_start) > 50:
                    ax2.text(range_center, 1.12, label, 
                            transform=ax2.get_xaxis_transform(),
                            ha='center', va='bottom', fontsize=9, color='gray')
        
        # Set the ticks on the secondary axis
        ax2.set_xticks(tick_positions)
        ax2.set_xticklabels(tick_labels, fontsize=8, color='gray')
        ax2.tick_params(axis='x', colors='gray', pad=2)
    
    # save the figure if a filename was specified
    if filename:
        plt.savefig(filename, dpi=300)

    # show the plot
    if not suppress:
        plt.show()


"""
Plots multiple SPDs

@param list spds                            The SPDs in a list
@param tuple figsize [optional]             The (width,height) of the plotted figure
@param string filename [optional]           If specified, will save plot as the specified filename
@param string ylabel [optional]             If specified, this will replace 'Intensity' on the y axis
@param bool hideyaxis [optional]            If True, the y axis will not be shown
@param bool supress [optional]              If True, the plot will not be shown
@param string title [optional]              If not None, display the specified title text
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
        spds, figsize=(8,4), filename=None, ylabel='Intensity', hideyaxis=False, suppress=False, title=None,
        xlim=(360,780), xtick=30, ytick=0.2, melanopic_curve=False,
        colorbar=True, showlegend=True, legend_loc='upper left'
    ):
    # TODO fix non-colorbar display

    # create the figure
    fig, (ax0, ax1) = plt.subplots(2, 1, figsize=figsize, tight_layout=True, sharex=True, \
                                   gridspec_kw={'height_ratios':[8,1], 'hspace':0})
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
        # set_smart_bounds deprecated in newer matplotlib versions
        # ax1.spines['bottom'].set_smart_bounds(True)
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

        legend_vals.append(spd.name)
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

    # show title
    if title:
        plt.suptitle(title)

    # change the style of the axis spines
    ax0.spines['top'].set_color('none')
    ax0.spines['right'].set_color('none')
    # set_smart_bounds deprecated in newer matplotlib versions
    # ax0.spines['left'].set_smart_bounds(True)
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
