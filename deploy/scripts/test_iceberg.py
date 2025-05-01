import logging
import os

from pyspark.sql import SparkSession
from pyspark.sql.types import (
    DoubleType,
    FloatType,
    LongType,
    StringType,
    StructField,
    StructType,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("IcebergMinIODemo")


def create_spark_session():
    """Create and configure the Spark session with Iceberg and MinIO support."""

    # Default values for environment variables
    warehouse_path = os.getenv("WAREHOUSE_PATH", "s3a://warehouse")
    s3_endpoint = os.getenv(
        "S3_ENDPOINT", "http://minio.storage.svc.cluster.local:9000"
    )
    s3_access_key = os.getenv("AWS_ACCESS_KEY_ID", "minio")
    s3_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY", "minio123")
    catalog_name = os.getenv("ICEBERG_CATALOG", "local")

    spark = (
        SparkSession.builder.appName("IcebergMinIOExample")
        .config(
            "spark.sql.extensions",
            "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions",
        )
        .config(
            f"spark.sql.catalog.{catalog_name}", "org.apache.iceberg.spark.SparkCatalog"
        )
        .config(
            "spark.sql.catalog.spark_catalog",
            "org.apache.iceberg.spark.SparkSessionCatalog",
        )
        .config("spark.sql.catalog.spark_catalog.type", "hive")
        .config(f"spark.sql.catalog.{catalog_name}.type", "hadoop")
        .config(f"spark.sql.catalog.{catalog_name}.warehouse", warehouse_path)
        .config(
            f"spark.sql.catalog.{catalog_name}.io-impl",
            "org.apache.iceberg.hadoop.HadoopFileIO",
        )
        .config(f"spark.sql.catalog.{catalog_name}.s3.endpoint", s3_endpoint)
        .config("spark.sql.defaultCatalog", catalog_name)
        .config("spark.hadoop.fs.s3a.access.key", s3_access_key)
        .config("spark.hadoop.fs.s3a.secret.key", s3_secret_key)
        .config("spark.hadoop.fs.s3a.endpoint", s3_endpoint)
        .config("spark.hadoop.fs.s3a.path.style.access", "true")
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
        .getOrCreate()
    )

    spark.sparkContext.setLogLevel("WARN")
    return spark


def main():
    logger.info("Starting Iceberg MinIO demo")
    spark = create_spark_session()

    logger.info("Creating empty schema for demo.nyc.taxis")

    schema = StructType(
        [
            StructField("vendor_id", LongType(), True),
            StructField("trip_id", LongType(), True),
            StructField("trip_distance", FloatType(), True),
            StructField("fare_amount", DoubleType(), True),
            StructField("store_and_fwd_flag", StringType(), True),
        ]
    )

    df = spark.createDataFrame([], schema)
    df.write.format("iceberg").mode("overwrite").saveAsTable("demo.nyc.taxis")

    logger.info("Inserting data into demo.nyc.taxis")

    data = [
        (1, 1000371, 1.8, 15.32, "N"),
        (2, 1000372, 2.5, 22.15, "N"),
        (2, 1000373, 0.9, 9.01, "N"),
        (1, 1000374, 8.4, 42.13, "Y"),
    ]

    schema = spark.table("demo.nyc.taxis").schema
    df = spark.createDataFrame(data, schema)
    df.writeTo("demo.nyc.taxis").append()

    logger.info("Querying demo.nyc.taxis")
    spark.table("demo.nyc.taxis").show()


if __name__ == "__main__":
    main()
