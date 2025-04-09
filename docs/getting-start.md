# Getting Started with Lakehouse Lab

This guide will walk you through the prerequisites, installation, configuration, and usage of Lakehouse Lab.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node 23.5.0** or higher
- **Golang 1.24** or higher
- **Python 3.12** or higher
- **Poetry 1.8.5** – a dependency management tool for Python
- **Docker 27.4.0** or higher

---

## 1. Clone the Repository

Clone the repository from GitHub and change to the project directory:

```bash
git clone https://github.com/FabioCaffarello/lakehouse-lab.git
cd lakehouse-lab
```

---

## 2. Set Up the Virtual Environment

Set up the project with a single command:

```bash
make setup
```

This command will:

- Create a virtual environment in the `.venv` directory.
- Install all dependencies (including development and documentation extras).
- Set up pre-commit hooks for both commit and push stages.

---

## 3. Running the Service

To start the development server with auto-reload enabled, run:

```bash
make run
```

This command launches the Lakehouse Lab service, making the REST API available for testing and integration.

---

## 4. Running Tests

To run the entire test suite, use the following command:

```bash
make check-all
```

This command executes all tests with `pytest` in the controlled environment and outputs the results along with a coverage report.

---

## 5. Linting and Code Quality

To keep your code clean and consistent, use these commands:

- **Lint Code (using Ruff):**

  ```bash
  make lint
  ```

- **Run Pre-commit Hooks:**

  ```bash
  make precommit
  ```

---

## 6. Documentation

### Serve Documentation Locally

The project documentation is managed with MkDocs. To serve it locally with live reload, run:

```bash
make server-docs
```

Then visit [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser.

### Deploy Documentation

To build and deploy the documentation to GitHub Pages:

```bash
make deploy-docs
```

This command builds the docs and pushes them to the appropriate branch for GitHub Pages hosting.

---

## 7. Additional Commands

For more tasks and a complete list of available commands, run:

```bash
make help
```

This will display a summary of all available Makefile targets and their descriptions.

---

## 8. Troubleshooting

- **Virtual Environment Issues:**
  If you experience problems with the virtual environment, try clearing cached files by running:

  ```bash
  make clean
  make setup
  ```

- **Pre-commit Hooks Not Running:**
  If pre-commit hooks aren’t working as expected, install them manually:

  ```bash
  pre-commit install
  ```

- **Dependency Updates:**
  When updating dependencies in `pyproject.toml`, run the following commands to refresh the lock file:

  ```bash
  npx nx reset
  poetry update
  ```
