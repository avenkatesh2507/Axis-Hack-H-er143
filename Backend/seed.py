# seed.py
from db import employees_collection
from datetime import datetime
import random

employees_collection.delete_many({})

roles = [
    "Backend Engineer",
    "Frontend Engineer",
    "Product Manager",
    "Designer",
    "DevOps Engineer",
    "QA Engineer",
    "Data Analyst"
]

first_names = [
    "Alice","Bob","Charlie","David","Emma","Frank","Grace","Hannah",
    "Isaac","Jack","Karen","Leo","Mia","Nathan","Olivia","Paul",
    "Quinn","Rachel","Sam","Tina","Uma","Victor","Wendy","Xavier",
    "Yara","Zane"
]

employees = []

for i in range(1, 91):
    employee = {
        "employee_id": f"AX-{str(i).zfill(3)}",
        "name": f"{random.choice(first_names)} {i}",
        "role": random.choice(roles),
        "calendar_email": "aparnavenkatesh2@gmail.com",
        "tasks": [],
        "is_burned_out": False,
        "last_synced": None,
        "created_at": datetime.utcnow()
    }
    employees.append(employee)

employees_collection.insert_many(employees)
print("✅ 90 employees seeded.")