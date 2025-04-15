import airflow
from airflow import DAG
from airflow.operators.python import PythonOperator
from start_emulator_operator import StartEmulatorOperator
from status_emulation_operator import StatusEmulationOperator

dag = DAG(
    dag_id="all_emulations_dag",
    default_args={
        "owner": "Fabio Caffarello",
        "start_date": airflow.utils.dates.days_ago(1),
    },
    schedule_interval="@daily",
)

start = PythonOperator(
    task_id="start",
    python_callable=lambda: print("Jobs started"),
    dag=dag,
)

start_emulator_user_profile = StartEmulatorOperator(
    task_id="start_emulator_user_profile_task",
    endpoint="http://data-emulator:8000/emulator/",
    emulator_sync="minio",
    emulation_domain="user-profile",
    format_type="json",
    sync_type="grouped",
    max_chunk_size=1024,
    timeout=30,
    dag=dag,
)

status_emulation_user_profile = StatusEmulationOperator(
    task_id="status_emulator_user_profile_task",
    endpoint="http://data-emulator:8000/emulator/{}/status",
    prev_task_id="start_emulator_user_profile_task",
    dag=dag,
)

sart_emulation_device = StartEmulatorOperator(
    task_id="start_emulator_device_task",
    endpoint="http://data-emulator:8000/emulator/",
    emulator_sync="kafka",
    emulation_domain="device-log",
    format_type="json",
    sync_type="grouped",
    max_chunk_size=1024,
    timeout=60,
    dag=dag,
)

status_emulation_device = StatusEmulationOperator(
    task_id="status_emulator_device_task",
    endpoint="http://data-emulator:8000/emulator/{}/status",
    prev_task_id="start_emulator_device_task",
    dag=dag,
)

start_emulation_transaction = StartEmulatorOperator(
    task_id="start_emulator_transaction_task",
    endpoint="http://data-emulator:8000/emulator/",
    emulator_sync="kafka",
    emulation_domain="transaction",
    format_type="json",
    sync_type="grouped",
    max_chunk_size=1024,
    timeout=60,
    dag=dag,
)

status_emulation_transaction = StatusEmulationOperator(
    task_id="status_emulator_transaction_task",
    endpoint="http://data-emulator:8000/emulator/{}/status",
    prev_task_id="start_emulator_transaction_task",
    dag=dag,
)

end = PythonOperator(
    task_id="end",
    python_callable=lambda: print("Jobs completed successfully"),
    dag=dag,
)

start >> start_emulator_user_profile >> status_emulation_user_profile
start >> sart_emulation_device >> status_emulation_device
start >> start_emulation_transaction >> status_emulation_transaction
status_emulation_user_profile >> end
status_emulation_device >> end
status_emulation_transaction >> end
