#!/usr/bin/env python3
"""
Beautiful Photometry Command Line Interface

A modernized CLI for the Beautiful Photometry tool that preserves all original functionality
while following Python best practices.
"""

import argparse
import sys
import os
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any

# Import the existing photometry modules
from .spectrum import import_spd, import_spd_batch
from .plot import plot_spectrum, plot_multi_spectrum
from .human_circadian import melanopic_ratio, melanopic_response, melanopic_lumens, melanopic_photopic_ratio
from .human_visual import scotopic_photopic_ratio


def validate_file_path(file_path: str) -> str:
    """Validate that a file exists and return the absolute path."""
    path = Path(file_path)
    if not path.exists():
        raise argparse.ArgumentTypeError(f"File does not exist: {file_path}")
    return str(path.absolute())


def validate_directory_path(dir_path: str) -> str:
    """Validate that a directory exists and return the absolute path."""
    path = Path(dir_path)
    if not path.exists() or not path.is_dir():
        raise argparse.ArgumentTypeError(f"Directory does not exist: {dir_path}")
    return str(path.absolute())


def calculate_metrics(spd) -> Dict[str, Any]:
    """Calculate all metrics for a given SPD."""
    return {
        'name': spd.strict_name,
        'melanopic_ratio': round(melanopic_ratio(spd), 3),
        'melanopic_response': round(melanopic_response(spd), 1),
        'scotopic_photopic_ratio': round(scotopic_photopic_ratio(spd), 3),
        'melanopic_photopic_ratio': round(melanopic_photopic_ratio(spd), 3)
    }


def print_metrics(metrics: Dict[str, Any]) -> None:
    """Print metrics in a formatted way."""
    print(f"\nMetrics for {metrics['name']}:")
    print(f"  Melanopic Ratio: {metrics['melanopic_ratio']}")
    print(f"  Melanopic Response: {metrics['melanopic_response']}")
    print(f"  Scotopic/Photopic Ratio: {metrics['scotopic_photopic_ratio']}")
    print(f"  Melanopic/Photopic Ratio: {metrics['melanopic_photopic_ratio']}")


def single_spd_command(args: argparse.Namespace) -> None:
    """Handle single SPD analysis command."""
    try:
        # Import the SPD
        spd = import_spd(
            filename=args.file,
            spd_name=args.name,
            weight=args.weight,
            normalize=args.normalize,
            photometer=args.photometer
        )
        
        # Calculate and print metrics
        metrics = calculate_metrics(spd)
        print_metrics(metrics)
        
        # Create plot options
        plot_options = {
            'spd': spd,
            'figsize': tuple(args.figsize),
            'filename': args.output,
            'title': args.title or spd.strict_name,
            'melanopic_curve': args.melanopic_curve,
            'melanopic_stimulus': args.melanopic_stimulus,
            'hideyaxis': args.hide_yaxis,
            'suppress': not args.show_plot
        }
        
        # Generate plot
        plot_spectrum(**plot_options)
        
        if args.output:
            print(f"\nPlot saved to: {args.output}")
            
    except Exception as e:
        print(f"Error processing SPD: {e}", file=sys.stderr)
        sys.exit(1)


def compare_command(args: argparse.Namespace) -> None:
    """Handle spectrum comparison command."""
    try:
        spds = []
        
        # Import all SPDs
        for file_path in args.files:
            spd = import_spd(
                filename=file_path,
                normalize=args.normalize,
                photometer=args.photometer
            )
            spds.append(spd)
        
        if len(spds) < 2:
            print("Error: At least 2 spectra are required for comparison", file=sys.stderr)
            sys.exit(1)
        
        # Calculate and print metrics for each SPD
        for spd in spds:
            metrics = calculate_metrics(spd)
            print_metrics(metrics)
        
        # Create plot options
        plot_options = {
            'spds': spds,
            'figsize': tuple(args.figsize),
            'filename': args.output,
            'title': args.title or 'Spectral Comparison',
            'melanopic_curve': args.melanopic_curve,
            'hideyaxis': args.hide_yaxis,
            'showlegend': args.show_legend,
            'legend_loc': args.legend_location,
            'suppress': not args.show_plot
        }
        
        # Generate plot
        plot_multi_spectrum(**plot_options)
        
        if args.output:
            print(f"\nComparison plot saved to: {args.output}")
            
    except Exception as e:
        print(f"Error comparing spectra: {e}", file=sys.stderr)
        sys.exit(1)


def batch_command(args: argparse.Namespace) -> None:
    """Handle batch processing command."""
    try:
        # Import all SPDs from directory
        spds_dict = import_spd_batch(
            directory=args.directory,
            photometer=args.photometer,
            printNames=args.verbose
        )
        
        if not spds_dict:
            print("No SPD files found in the specified directory", file=sys.stderr)
            sys.exit(1)
        
        spds = list(spds_dict.values())
        
        # Calculate and print metrics for each SPD
        for spd in spds:
            metrics = calculate_metrics(spd)
            print_metrics(metrics)
        
        # Create comparison plot if requested
        if args.output:
            plot_options = {
                'spds': spds,
                'figsize': tuple(args.figsize),
                'filename': args.output,
                'title': args.title or f'Batch Comparison ({len(spds)} spectra)',
                'melanopic_curve': args.melanopic_curve,
                'hideyaxis': args.hide_yaxis,
                'showlegend': args.show_legend,
                'legend_loc': args.legend_location,
                'suppress': not args.show_plot
            }
            
            plot_multi_spectrum(**plot_options)
            print(f"\nBatch comparison plot saved to: {args.output}")
            
    except Exception as e:
        print(f"Error in batch processing: {e}", file=sys.stderr)
        sys.exit(1)


def create_parser() -> argparse.ArgumentParser:
    """Create and configure the argument parser."""
    parser = argparse.ArgumentParser(
        description="Beautiful Photometry - Analyze and visualize spectral power distributions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s single CSVs/incandescent.csv --normalize --melanopic-curve
  %(prog)s compare CSVs/incandescent.csv CSVs/halogen.csv --output comparison.png
  %(prog)s batch CSVs/ --output batch_comparison.png --normalize
        """
    )
    
    # Global options
    parser.add_argument(
        '--photometer',
        choices=['none', 'uprtek'],
        default='none',
        help='Photometer type for file import (default: none)'
    )
    parser.add_argument(
        '--figsize',
        nargs=2,
        type=float,
        default=[10, 6],
        metavar=('WIDTH', 'HEIGHT'),
        help='Figure size in inches (default: 10 6)'
    )
    parser.add_argument(
        '--output',
        '-o',
        help='Output file path for saving plots'
    )
    parser.add_argument(
        '--title',
        help='Plot title'
    )
    parser.add_argument(
        '--no-show',
        dest='show_plot',
        action='store_false',
        help='Do not display the plot (useful for saving only)'
    )
    parser.add_argument(
        '--verbose',
        '-v',
        action='store_true',
        help='Verbose output'
    )
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Single SPD command
    single_parser = subparsers.add_parser(
        'single',
        help='Analyze a single SPD file'
    )
    single_parser.add_argument(
        'file',
        type=validate_file_path,
        help='SPD file path'
    )
    single_parser.add_argument(
        '--name',
        help='Name for the SPD (default: filename without extension)'
    )
    single_parser.add_argument(
        '--weight',
        type=float,
        default=1.0,
        help='Weight multiplier (default: 1.0)'
    )
    single_parser.add_argument(
        '--normalize',
        action='store_true',
        help='Normalize the SPD to [0,1]'
    )
    single_parser.add_argument(
        '--melanopic-curve',
        action='store_true',
        help='Show melanopic sensitivity curve'
    )
    single_parser.add_argument(
        '--melanopic-stimulus',
        action='store_true',
        help='Show melanopic stimulus'
    )
    single_parser.add_argument(
        '--hide-yaxis',
        action='store_true',
        help='Hide Y-axis'
    )
    
    # Compare command
    compare_parser = subparsers.add_parser(
        'compare',
        help='Compare multiple SPD files'
    )
    compare_parser.add_argument(
        'files',
        nargs='+',
        type=validate_file_path,
        help='SPD file paths (at least 2 required)'
    )
    compare_parser.add_argument(
        '--normalize',
        action='store_true',
        help='Normalize all SPDs to [0,1]'
    )
    compare_parser.add_argument(
        '--melanopic-curve',
        action='store_true',
        help='Show melanopic sensitivity curve'
    )
    compare_parser.add_argument(
        '--hide-yaxis',
        action='store_true',
        help='Hide Y-axis'
    )
    compare_parser.add_argument(
        '--show-legend',
        action='store_true',
        default=True,
        help='Show legend (default: True)'
    )
    compare_parser.add_argument(
        '--legend-location',
        choices=['upper left', 'upper right', 'lower left', 'lower right', 'center'],
        default='upper left',
        help='Legend location (default: upper left)'
    )
    
    # Batch command
    batch_parser = subparsers.add_parser(
        'batch',
        help='Process all SPD files in a directory'
    )
    batch_parser.add_argument(
        'directory',
        type=validate_directory_path,
        help='Directory containing SPD files'
    )
    batch_parser.add_argument(
        '--normalize',
        action='store_true',
        help='Normalize all SPDs to [0,1]'
    )
    batch_parser.add_argument(
        '--melanopic-curve',
        action='store_true',
        help='Show melanopic sensitivity curve'
    )
    batch_parser.add_argument(
        '--hide-yaxis',
        action='store_true',
        help='Hide Y-axis'
    )
    batch_parser.add_argument(
        '--show-legend',
        action='store_true',
        default=True,
        help='Show legend (default: True)'
    )
    batch_parser.add_argument(
        '--legend-location',
        choices=['upper left', 'upper right', 'lower left', 'lower right', 'center'],
        default='upper left',
        help='Legend location (default: upper left)'
    )
    
    return parser


def main() -> None:
    """Main entry point for the CLI."""
    parser = create_parser()
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Route to appropriate command handler
    if args.command == 'single':
        single_spd_command(args)
    elif args.command == 'compare':
        compare_command(args)
    elif args.command == 'batch':
        batch_command(args)
    else:
        print(f"Unknown command: {args.command}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main() 