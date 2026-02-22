# db.py
from dotenv import load_dotenv
import os
from pymongo import MongoClient

# Load environment variables from .env file
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")  # put in .env
client = MongoClient(MONGO_URI)

db = client["Axis"]
employees_collection = db["employees"]