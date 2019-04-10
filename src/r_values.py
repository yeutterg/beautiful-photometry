"""R Values

These functions deal with R-values

The functions are:

    * plot_r_values - Plots the specified R values in a bar graph
"""

import matplotlib.pyplot as plt

r_hex_colors = {
    'R1': '#e49da7',
    'R2': '#c5a779',
    'R3': '#a1b957',
    'R4': '#64bd95',
    'R5': '#74bada',
    'R6': '#84adff',
    'R7': '#c59bff',
    'R8': '#eb99ec',
    'R9': '#e61d43',
    'R10': '#fff24c',
    'R11': '#0fa27f',
    'R12': '#0051b8',
    'R13': '#fee2d2',
    'R14': '#617246',
    'R15': '#f4c59b'
}

def plot_r_values(r_values:dict, figsize=(8,4), showvals=True, title=None, filename=None, suppress=False):
    """Plots the specified R values in a bar graph

    Parameters
    ----------
    r_values : dict
        A dictionary containing the R values that you want to plot. Values can be int or float, e.g.:
        {'R4': 97, 'R8': 42.76}
    figsize : tuple
        The (width,height) of the plotted figure
    showvals : bool
        If True, numbers will be displayed at the top of each bar
    title : str or None
        If not None, display the specified title text
    filename : str or None
        If specified, will save plot as the specified filename
    suppress : bool
        If True, the plot will not be shown
    """

    # match each given R-value with a hex color
    colors = []
    for r in r_values:
        if r in r_hex_colors:
            colors.append(r_hex_colors[r])
        else:
            colors.append('blue')

    # plot
    fig, ax = plt.subplots(1, 1, figsize=figsize, tight_layout=True)
    ax.bar(r_values.keys(), r_values.values(), color=colors)

    # display values
    if showvals:
        for i, val in enumerate(list(r_values.values())):
            ax.text(i - 0.25, val + 2, round(val))

    # show title
    if title:
        plt.title(title)

    # set axis style
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
