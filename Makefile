
SHELL := /bin/bash

VENV_DIR := .venv
VENV_BIN_DIR := $(VENV_DIR)/bin
SCRIPTS_DIR := scripts
SETUP_SCRIPT := $(SCRIPTS_DIR)/setup.sh

PYTHON ?= poetry
SHELL_CMD := source
PRE_COMMIT := pre-commit
NPM := npm
DOCKER_COMPOSE := docker compose

.PHONY: help setup install precommit clean lint check-all lint-docstrings run stop build-docs serve-docs deploy-docs

help:
	@echo "Available targets:"
	@echo "  setup            - Run project setup script"
	@echo "  install          - Create virtual environment (if needed), install dependencies, and set up pre-commit hooks"
	@echo "  precommit        - Run pre-commit checks on all files"
	@echo "  clean            - Remove Python caches and temporary files"
	@echo "  lint             - Lint code using Ruff"
	@echo "  check-all        - Run tests and linting"
	@echo "  lint-docstrings  - Lint docstrings using pydocstyle"
	@echo "  build-docs       - Build documentation and start PlantUML server"
	@echo "  run 			  - Run the application"
	@echo "  stop 			  - Stop the application"
	@echo "  serve-docs       - Serve documentation locally"
	@echo "  deploy-docs      - Deploy documentation to GitHub Pages"

# setup:
# 	@chmod +x $(SCRIPTS_DIR)/init-multiple-dbs.sh
# 	@chmod +x $(SCRIPTS_DIR)/wait-for-it.sh
# 	@chmod +x $(SETUP_SCRIPT)
# 	@$(SETUP_SCRIPT)

install:
	@echo "Installing dependencies..."
	$(NPM) install
	$(PYTHON) install --no-root
	$(PRE_COMMIT) install --hook-type commit-msg
	$(PRE_COMMIT) install --hook-type pre-commit

precommit:
	$(PRE_COMMIT) run --all-files

clean:
	@echo "Cleaning up cache directories and temporary files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} +
	@find . -type d -name ".pytest_cache" -exec rm -rf {} +
	@find . -type d -name ".mypy_cache" -exec rm -rf {} +
	@find . -type d -name ".coverage" -exec rm -rf {} +
	@find . -type d -name ".ruff_cache" -exec rm -rf {} +
	@find . -type f -name "*.pyc" -delete
	@echo "Clean complete."

lint-docstrings:
	$(PYTHON) run pydoclint --style=google --check-return-types=false --exclude=.venv .

build-docs:
	@echo "Building documentation..."
	@npx nx graph --file=docs/dependency-graph/index.html
	@docker run -d -p 8080:8080 plantuml/plantuml-server:jetty

lint:
	npx nx run-many --target=lint --all
	npx nx run-many --target=fmt --all

check-all:
	npx nx run-many --target=test --all
	npx nx run-many --target=check --all

serve-docs: build-docs
	@echo "Serving documentation..."
	$(PYTHON) run -- python -m mkdocs serve

deploy-docs: build-docs
	$(PYTHON) run -- python -m mkdocs gh-deploy

run:
	$(DOCKER_COMPOSE) up -d --build

run-emulator:
	$(DOCKER_COMPOSE) --profile flower -f docker-compose.kafka.yml up -d --build

stop:
	$(DOCKER_COMPOSE)  --profile flower -f docker-compose.airflow.yml down
	$(DOCKER_COMPOSE) down
