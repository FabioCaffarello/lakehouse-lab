import airflow
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.apache.spark.operators.spark_submit import SparkSubmitOperator
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
    timeout=20,
    dag=dag,
)

status_emulation_user_profile = StatusEmulationOperator(
    task_id="status_emulator_user_profile_task",
    endpoint="http://data-emulator:8000/emulator/{}/status",
    prev_task_id="start_emulator_user_profile_task",
    dag=dag,
)

MINIO_ENDPOINT = "http://minio:9000"
MINIO_ACCESS_KEY = "minio"
MINIO_SECRET_KEY = "minio123"


spark_conf = {
    "spark.jars.packages": "org.apache.hadoop:hadoop-aws:3.3.4,com.amazonaws:aws-java-sdk-bundle:1.12.262",
    "spark.driver.extraJavaOptions": "-Divy.cache.dir=/tmp -Divy.home=/tmp",
    "spark.hadoop.fs.s3a.endpoint": MINIO_ENDPOINT,
    "spark.hadoop.fs.s3a.access.key": MINIO_ACCESS_KEY,
    "spark.hadoop.fs.s3a.secret.key": MINIO_SECRET_KEY,
    "spark.hadoop.fs.s3a.path.style.access": "true",
    "spark.hadoop.fs.s3a.impl": "org.apache.hadoop.fs.s3a.S3AFileSystem",
    "spark.hadoop.fs.s3a.connection.ssl.enabled": "false",
    "spark.sql.shuffle.partitions": 20,
}

bronze_user_profile_spark_job = SparkSubmitOperator(
    task_id="bronze_user_profile_spark_job",
    conn_id="spark-conn",
    application="jobs/python/bronze_user_profile.py",
    conf=spark_conf,
    dag=dag,
)

silver_user_profile_spark_job = SparkSubmitOperator(
    task_id="silver_user_profile_spark_job",
    conn_id="spark-conn",
    application="jobs/python/silver_user_profile.py",
    conf=spark_conf,
    dag=dag,
)

end = PythonOperator(
    task_id="end",
    python_callable=lambda: print("Jobs completed successfully"),
    dag=dag,
)

(
    start
    >> start_emulator_user_frofile
    >> status_emulation_user_profile
    >> bronze_user_profile_spark_job
    >> silver_user_profile_spark_job
    >> end
)
