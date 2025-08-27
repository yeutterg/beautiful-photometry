"""
Main entry point for running Beautiful Photometry as a module.

Usage:
    python -m beautiful_photometry web [--port PORT] [--host HOST] [--no-debug]  # Start web interface
    python -m beautiful_photometry cli    # Run CLI
"""

import sys
import argparse
from .web import run_app
from .cli import main as cli_main


def main():
    """Main entry point for module execution."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m beautiful_photometry web [--port PORT] [--host HOST] [--no-debug]  # Start web interface")
        print("  python -m beautiful_photometry cli    # Run CLI")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "web":
        # Parse web-specific arguments
        parser = argparse.ArgumentParser(description="Beautiful Photometry Web Interface")
        parser.add_argument('--port', type=int, default=8765, help='Port to run the server on (default: 8765)')
        parser.add_argument('--host', default='0.0.0.0', help='Host to bind to (default: 0.0.0.0)')
        parser.add_argument('--no-debug', action='store_true', help='Disable debug mode')
        
        # Parse only the web arguments (skip the first two: module name and 'web')
        web_args = parser.parse_args(sys.argv[2:])
        
        print(f"Starting Beautiful Photometry web interface on http://{web_args.host}:{web_args.port}")
        run_app(host=web_args.host, port=web_args.port, debug=not web_args.no_debug)
        
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