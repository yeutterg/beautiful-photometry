"""
Main entry point for running Beautiful Photometry as a module.

Usage:
    python -m beautiful_photometry web    # Start web interface
    python -m beautiful_photometry cli    # Run CLI
"""

import sys
from .web import run_app
from .cli import main as cli_main


def main():
    """Main entry point for module execution."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m beautiful_photometry web    # Start web interface")
        print("  python -m beautiful_photometry cli    # Run CLI")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "web":
        run_app()
    elif command == "cli":
        # Remove the first argument (module name) and second (command)
        sys.argv = sys.argv[2:]
        cli_main()
    else:
        print(f"Unknown command: {command}")
        print("Available commands: web, cli")
        sys.exit(1)


if __name__ == "__main__":
    main() 