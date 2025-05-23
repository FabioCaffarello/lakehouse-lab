import airflow
from airflow import DAG
from airflow.operators.bash import BashOperator

default_args = {
    "owner": "datamasterylab.com",
    "start_date": airflow.utils.dates.days_ago(1),
    "catchup": False,
}

dag = DAG("hello_world", default_args=default_args, schedule="@daily")

t1 = BashOperator(task_id="hello_world", bash_command='echo "Hello World"', dag=dag)

t2 = BashOperator(
    task_id="hello_dml", bash_command='echo "Hello Data Mastery Lab"', dag=dag
)

t1 >> t2
