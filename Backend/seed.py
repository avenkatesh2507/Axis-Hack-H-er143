from db import employees_collection
from datetime import datetime

employees_collection.insert_many([
    {
        "employee_id": "AX-001",
        "name": "Alice",
        "role": "Backend Engineer",
        "calendar_email": "alice@gmail.com",
        "tasks": [],
        "is_burned_out": False,
        "last_synced": None
    },
    {
        "employee_id": "AX-002",
        "name": "Bob",
        "role": "Frontend Engineer",
        "calendar_email": "bob@gmail.com",
        "tasks": [],
        "is_burned_out": False,
        "last_synced": None
    }
])

print("Axis employees seeded.")