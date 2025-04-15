# Airflow Application

The Airflow App is a core component of the Lakehouse Lab ecosystem, responsible for orchestrating data workflows and managing data processing jobs. This project leverages Apache Airflow to automate and schedule tasks such as running data pipelines, monitoring process statuses, and integrating with other Lakehouse Lab services.

## Overview

This Airflow application includes:

- **DAGs:**
  - `fraud_pipeline_dag.py`: Orchestrates the fraud detection pipeline, managing job dependencies and scheduling.
- **Jobs:**
  Python scripts for processing data at different stages:
  - `bronze_user_profile.py`: Processes raw user profile data (Bronze layer).
  - `silver_user_profile.py`: Handles transformation and enrichment of user profile data (Silver layer).
- **Plugins:**
  Custom Airflow operators:
  - `start_emulator_operator.py`: Initiates data emulator processes.
  - `status_emulation_operator.py`: Monitors the status of data emulation tasks.

The project is managed using Poetry for dependency management. A Dockerfile is provided for containerized deployments.

## Custom Plugins

### Start Emulator Operator

The `start_emulator_operator.py` plugin defines a custom operator to trigger the Data Emulator Service via its API. This operator encapsulates the logic needed to initialize an emulator task and pass the necessary configuration.

### Status Emulation Operator

The `status_emulation_operator.py` plugin allows the Airflow DAG to query the status of an ongoing emulation process, ensuring that downstream tasks only run when data generation is complete.

## Further Information

For more detailed technical documentation on the Data Emulator Service, including usage examples, API endpoints, and extended architecture details, please visit:
[Lakehouse Lab Data Emulator Documentation](https://fabiocaffarello.github.io/lakehouse-lab/reference/services/data-emulator)
