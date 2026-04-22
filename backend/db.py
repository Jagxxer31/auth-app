import os
import mysql.connector
from pymongo import MongoClient
import redis

def get_mysql():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DB"),
        port=3306
    )

mongo_client = MongoClient(os.getenv("MONGO_URI"))
mongo_db = mongo_client["guvi_auth"]

redis_client = redis.Redis.from_url(os.getenv("REDIS_URL"), decode_responses=True)