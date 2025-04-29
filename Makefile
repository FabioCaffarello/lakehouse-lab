
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

.PHONY: help install precommit clean lint-all check-all lint-affected check-affected lint-docstrings run-prod-compose stop-prod-compose setup-airflow-conn image run-compose setup stop-compose build-docs serve-docs deploy-docs


help:
	@echo "Available targets:"
	@printf "  %-15s - %s\n" "install" "Create virtual environment (if needed), install dependencies, and set up pre-commit hooks"
	@printf "  %-15s - %s\n" "precommit" "Run pre-commit checks on all files"
	@printf "  %-15s - %s\n" "clean" "Remove Python caches and temporary files"
	@printf "  %-15s - %s\n" "lint-all" "Run all linters and formatters"
	@printf "  %-15s - %s\n" "check-all" "Run tests and linting"
	@printf "  %-15s - %s\n" "lint-affected" "Run linters and formatters on affected files"
	@printf "  %-15s - %s\n" "check-affected" "Run tests and linting on affected files"
	@printf "  %-15s - %s\n" "lint-docstrings" "Lint docstrings using pydocstyle"
	@printf "  %-15s - %s\n" "run-prod-compose" "Run production Docker Compose setup"
	@printf "  %-15s - %s\n" "stop-prod-compose" "Stop production Docker Compose setup"
	@printf "  %-15s - %s\n" "setup-airflow-conn" "Set up Airflow connection for Spark"
	@printf "  %-15s - %s\n" "run-compose" "Run Docker Compose setup"
	@printf "  %-15s - %s\n" "setup" "Set up the environment (make sure to run this first)"
	@printf "  %-15s - %s\n" "stop-compose" "Stop the composer"
	@printf "  %-15s - %s\n" "build-docs" "Build documentation"
	@printf "  %-15s - %s\n" "serve-docs" "Serve documentation locally"
	@printf "  %-15s - %s\n" "image" "Build all images"
	@printf "  %-15s - %s\n" "deploy-docs" "Deploy documentation to GitHub Pages"

setup:
	@chmod +x $(SCRIPTS_DIR)/init-multiple-dbs.sh
	@chmod +x $(SCRIPTS_DIR)/wait-for-it.sh

install:
	@echo "Installing dependencies..."
	$(NPM) install
	$(PYTHON) install --with dev --no-root
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
	@find . -type d -name "reports" -exec rm -rf {} +
	@find . -type d -name "coverage" -exec rm -rf {} +
	@find . -type f -name ".coverage" -delete
	@find . -type f -name "*.pyc" -delete
	@echo "Clean complete."

lint-docstrings:
	$(PYTHON) run pydoclint --style=google --check-return-types=false --exclude=.venv .

build-docs:
	@echo "Building documentation..."
	@npx nx graph --file=docs/dependency-graph/index.html
	@npx nx run-many --target=swag-doc --all
	@docker run -d -p 8080:8080 plantuml/plantuml-server:jetty

lint-all:
	npx nx run-many --target=lint --all
	npx nx run-many --target=fmt --all

lint-affected:
	npx nx affected -t lint

check-all:
	npx nx run-many --target=test --all
	npx nx run-many --target=check --all

check-affected:
	npx nx affected -t test
	npx nx affected -t check

serve-docs: build-docs
	@echo "Serving documentation..."
	$(PYTHON) run -- python -m mkdocs serve

deploy-docs: build-docs
	$(PYTHON) run -- python -m mkdocs gh-deploy

run-prod-compose:
	$(DOCKER_COMPOSE) -f docker-compose.yml -f docker-compose.airflow.yml --profile flower up -d

stop-prod-compose:
	$(DOCKER_COMPOSE) --profile flower -f docker-compose.airflow.yml down
	$(DOCKER_COMPOSE) down

image:
	npx nx run-many --target=image --all

run-compose:
	$(DOCKER_COMPOSE) up -d
	$(DOCKER_COMPOSE)	-f docker-compose.mini.airflow.yml up -d --build

stop-compose:
	$(DOCKER_COMPOSE) -f docker-compose.mini.airflow.yml down
	$(DOCKER_COMPOSE) down

setup-airflow-conn:
	docker exec -it webserver airflow connections add spark-conn --conn-type spark --conn-host "spark://spark-master:7077" --conn-extra '{"spark.jars.packages": "org.apache.hadoop:hadoop-aws:3.3.4,com.amazonaws:aws-java-sdk-bundle:1.12.262"}'
