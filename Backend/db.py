from pymongo import MongoClient

from dotenv import load_dotenv
import os

load_dotenv(dotenv_path=".env")

MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI, tls=True)
db = client["axis_core"]
employees_collection = db["employees"]