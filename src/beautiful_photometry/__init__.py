"""
Beautiful Photometry - Analyze and visualize spectral power distributions.

A comprehensive tool for analyzing and visualizing spectral power distributions (SPDs)
with both a modern web interface and command-line interface.
"""

__version__ = "2.0.0"
__author__ = "Beautiful Photometry Team"
__email__ = ""
__license__ = "MIT"

# Core imports
from .spectrum import (
    import_spd,
    import_spd_batch,
    import_spectral_csv,
    normalize_spd,
    weight_spd,
    create_colour_spd,
    reshape,
    get_reference_spectrum,
)

from .plot import (
    plot_spectrum,
    plot_multi_spectrum,
    generate_color_spectrum,
    wavelength_to_rgb,
    plot_melanopic_curve,
)

from .photometer import (
    uprtek_import_spectrum,
    uprtek_import_r_vals,
    uprtek_file_import,
)

from .human_circadian import (
    melanopic_ratio,
    melanopic_response,
    melanopic_lumens,
    melanopic_photopic_ratio,
    get_melanopic_curve,
)

from .human_visual import (
    scotopic_photopic_ratio,
)

# Web application
from .web import create_app

# CLI
from .cli import main

__all__ = [
    # Version info
    "__version__",
    "__author__",
    "__email__",
    "__license__",
    
    # Core spectrum functions
    "import_spd",
    "import_spd_batch", 
    "import_spectral_csv",
    "normalize_spd",
    "weight_spd",
    "create_colour_spd",
    "reshape",
    "get_reference_spectrum",
    
    # Plotting functions
    "plot_spectrum",
    "plot_multi_spectrum",
    "generate_color_spectrum",
    "wavelength_to_rgb",
    "plot_melanopic_curve",
    
    # Photometer functions
    "uprtek_import_spectrum",
    "uprtek_import_r_vals",
    "uprtek_file_import",
    
    # Human response functions
    "melanopic_ratio",
    "melanopic_response",
    "melanopic_lumens",
    "melanopic_photopic_ratio",
    "get_melanopic_curve",
    "scotopic_photopic_ratio",
    
    # Web and CLI
    "create_app",
    "main",
] 