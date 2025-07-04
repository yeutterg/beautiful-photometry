.PHONY: help install install-dev test lint format clean build docker-build docker-run web cli

help: ## Show this help message
	@echo "Beautiful Photometry - Development Commands"
	@echo "============================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install the package in development mode
	pip install -e .

install-dev: ## Install development dependencies
	pip install -e ".[dev]"

test: ## Run tests
	pytest tests/ -v --cov=beautiful_photometry --cov-report=html --cov-report=term

lint: ## Run linting checks
	flake8 src/ tests/
	mypy src/

format: ## Format code with black
	black src/ tests/

clean: ## Clean build artifacts
	rm -rf build/
	rm -rf dist/
	rm -rf *.egg-info/
	rm -rf .pytest_cache/
	rm -rf htmlcov/
	find . -type d -name __pycache__ -delete
	find . -type f -name "*.pyc" -delete

build: ## Build the package
	python -m build

docker-build: ## Build Docker image
	docker build -t beautiful-photometry .

docker-run: ## Run Docker container
	docker run -p 5000:5000 beautiful-photometry

web: ## Start web interface
	python -m beautiful_photometry.web

cli: ## Run CLI with help
	python -m beautiful_photometry.cli --help

check: format lint test ## Run all checks (format, lint, test)

pre-commit: ## Install pre-commit hooks
	pre-commit install

pre-commit-run: ## Run pre-commit on all files
	pre-commit run --all-files 