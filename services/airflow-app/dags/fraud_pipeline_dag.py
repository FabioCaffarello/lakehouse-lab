import airflow
from airflow import DAG
from airflow.operators.python import PythonOperator
from start_emulator_operator import StartEmulatorOperator
from status_emulation_operator import StatusEmulationOperator

dag = DAG(
    dag_id="fraud_pipeline_dag",
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

start_emulator_user_frofile = StartEmulatorOperator(
    task_id="start_emulator_user_profile_task",
    endpoint="http://data-emulator:8000/emulator/",
    emulator_sync="minio",
    emulation_domain="user-profile",
    timeout=10,
    dag=dag,
)

status_emulation_user_profile = StatusEmulationOperator(
    task_id="status_emulator_user_profile_task",
    endpoint="http://data-emulator:8000/emulator/{}/status",
    prev_task_id="start_emulator_user_profile_task",
    dag=dag,
)

end = PythonOperator(
    task_id="end",
    python_callable=lambda: print("Jobs completed successfully"),
    dag=dag,
)

start >> start_emulator_user_frofile >> status_emulation_user_profile >> end
