from db import employees_collection

employees_collection.insert_one({
    "employee_id": "AX-001",
    "name": "Alice"
})

print("Inserted successfully")