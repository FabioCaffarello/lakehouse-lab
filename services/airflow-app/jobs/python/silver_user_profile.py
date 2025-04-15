import logging

from pyspark.sql import SparkSession, Window
from pyspark.sql import functions as F
from pyspark.sql.types import TimestampType

logger = logging.getLogger(__name__)


MINIO_ENDPOINT = "http://minio:9000"
MINIO_ACCESS_KEY = "minio"
MINIO_SECRET_KEY = "minio123"

BRONZE_BUCKET_PATH = "s3a://bronze/user-profiles/parquet"
SILVER_BUCKET_PATH = "s3a://silver/user-profiles/parquet"


def create_spark_connection():
    spark_conn = None
    try:
        spark_conn = (
            SparkSession.builder.appName("SilverUserProfileProcessor")
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
            .config("spark.sql.legacy.timeParserPolicy", "LEGACY")
            .getOrCreate()
        )
        spark_conn.sparkContext.setLogLevel("ERROR")
    except Exception as e:
        logger.error(f"Error while connecting to Spark: {e}")
    return spark_conn


def main():
    spark = create_spark_connection()

    df_bronze = spark.read.parquet(BRONZE_BUCKET_PATH)
    window_reference = Window.partitionBy("user_id").orderBy(F.col("event_time").desc())

    logger.info("Bronze DataFrame Schema:")
    df_bronze.printSchema()
    df_silver = (
        df_bronze.withColumn("event_time", F.col("timestamp").cast(TimestampType()))
        .withColumn("signup_date", F.to_date(F.col("data.signup_date"), "yyyy-MM-dd"))
        .withColumn(
            "date_of_birth", F.to_date(F.col("data.date_of_birth"), "yyyy-MM-dd")
        )
        .select(
            F.col("emulation_id"),
            F.col("event_time"),
            F.col("data.user_id").alias("user_id"),
            F.col("data.name").alias("name"),
            F.col("data.email").alias("email"),
            F.col("data.phone").alias("phone"),
            F.col("date_of_birth"),
            F.col("data.address").alias("address"),
            F.col("data.country").alias("country"),
            F.col("signup_date"),
            F.col("data.credit_score").alias("credit_score"),
            F.col("data.risk_level").alias("risk_level"),
        )
        .withColumn("window_reference", F.row_number().over(window_reference))
        .where(F.col("window_reference") == 1)
        .drop("window_reference")
    )

    logger.info("Writing Silver DataFrame to bucket...")
    df_silver.write.mode("overwrite").parquet(SILVER_BUCKET_PATH)


if __name__ == "__main__":
    main()
