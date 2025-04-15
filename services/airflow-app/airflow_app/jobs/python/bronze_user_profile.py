import logging

from pyspark.sql import SparkSession
from pyspark.sql.types import (
    DoubleType,
    IntegerType,
    StringType,
    StructField,
    StructType,
)

logger = logging.getLogger(__name__)

BUCKET_NAME = "user-profiles"
BUCKET_DESTINATION = "bronze"


MINIO_ENDPOINT = "http://minio:9000"
MINIO_ACCESS_KEY = "minio"
MINIO_SECRET_KEY = "minio123"

raw_schema = StructType(
    [
        StructField("emulation_id", StringType(), True),
        StructField("timestamp", DoubleType(), True),
        StructField(
            "data",
            StructType(
                [
                    StructField("user_id", IntegerType(), True),
                    StructField("name", StringType(), True),
                    StructField("email", StringType(), True),
                    StructField("phone", StringType(), True),
                    StructField("date_of_birth", StringType(), True),
                    StructField("address", StringType(), True),
                    StructField("country", StringType(), True),
                    StructField("signup_date", StringType(), True),
                    StructField("credit_score", DoubleType(), True),
                    StructField("risk_level", StringType(), True),
                ]
            ),
            True,
        ),
    ]
)


def create_spark_connection():
    spark_conn = None
    try:
        spark_conn = (
            SparkSession.builder.appName("BronzeUserProfileProcessor")
            .config(
                "spark.jars.packages",
                "org.apache.hadoop:hadoop-aws:3.3.4,com.amazonaws:aws-java-sdk-bundle:1.12.262",
            )
            .config(
                "spark.driver.extraJavaOptions", "-Divy.cache.dir=/tmp -Divy.home=/tmp"
            )
            .config(
                "spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem"
            )
            .config("spark.hadoop.fs.s3a.endpoint", MINIO_ENDPOINT)
            .config("spark.hadoop.fs.s3a.access.key", MINIO_ACCESS_KEY)
            .config("spark.hadoop.fs.s3a.secret.key", MINIO_SECRET_KEY)
            .config("spark.hadoop.fs.s3a.path.style.access", "true")
            .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
            .config("spark.sql.shuffle.partitions", 20)
            .getOrCreate()
        )
        spark_conn.sparkContext.setLogLevel("ERROR")
    except Exception as e:
        logger.error(f"Error while connecting to Spark: {e}")
    return spark_conn


spark = create_spark_connection()

source_path = f"s3a://{BUCKET_NAME}/*.json"
bronze_path = f"s3a://{BUCKET_DESTINATION}/{BUCKET_NAME}/parquet"

raw_df = (
    spark.read.format("json")
    .schema(raw_schema)
    .option("maxFilesPerTrigger", 1)
    .load(source_path)
)


logger.info(f"Writing to bronze path: {bronze_path}")
raw_df.write.format("parquet").mode("overwrite").save(bronze_path)
