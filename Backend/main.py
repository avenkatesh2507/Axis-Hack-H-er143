from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Query, Body
from db import employees_collection
from google_calendar import get_calendar_service
from datetime import datetime, timedelta
import asyncio
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Axis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"]
)

# -----------------------------------
# Suggest Employees for Task Assignment
# -----------------------------------
@app.post("/suggest_employees")
def suggest_employees(
    required_skill: str = Body(None),
    limit: int = Body(5)
):
    query = {"is_burned_out": False}
    if required_skill:
        query["skills"] = required_skill
    # Find employees not burned out, optionally with the required skill
    employees = list(employees_collection.find(query, {"_id": 0}))
    # Sort by least number of tasks
    employees.sort(key=lambda e: len(e.get("tasks", [])))
    # Return up to 'limit' employees
    return employees[:limit]
from fastapi import FastAPI, HTTPException, Query
from db import employees_collection
from google_calendar import get_calendar_service
from datetime import datetime, timedelta
import asyncio
import logging

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Axis API")

# -----------------------------------
# Helper: Skill Generator
# -----------------------------------
def generate_mock_skills(role):
    role_skills = {
        "Backend Engineer": ["Python", "FastAPI", "MongoDB", "APIs"],
        "Frontend Engineer": ["React", "CSS", "JavaScript"],
        "Product Manager": ["Planning", "Strategy"],
        "Designer": ["Figma", "UI/UX"],
        "DevOps Engineer": ["Docker", "AWS"],
        "QA Engineer": ["Testing", "Automation"],
        "Data Analyst": ["SQL", "Python"]
    }
    return role_skills.get(role, ["Teamwork"])

# -----------------------------------
# Sync Calendar
# -----------------------------------
def sync_employee_calendar(employee):
    if "calendar_email" not in employee:
        logging.warning(f"Employee {employee['employee_id']} missing calendar_email, skipping sync.")
        return
    service = get_calendar_service()
    calendar_id = employee["calendar_email"]

    now = datetime.utcnow()
    start = now.replace(hour=0, minute=0, second=0)
    end = start + timedelta(hours=23, minutes=59)

    try:
        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=start.isoformat() + "Z",
            timeMax=end.isoformat() + "Z",
            singleEvents=True
        ).execute()

        events = events_result.get("items", [])

        tasks = [{
            "title": e.get("summary"),
            "start": e["start"].get("dateTime", e["start"].get("date")),
            "end": e["end"].get("dateTime", e["end"].get("date"))
        } for e in events]

        is_burned_out = len(tasks) > 5

        employees_collection.update_one(
            {"employee_id": employee["employee_id"]},
            {"$set": {
                "tasks": tasks,
                "is_burned_out": is_burned_out,
                "last_synced": datetime.utcnow()
            }}
        )

        logging.info(f"{employee['employee_id']} synced ({len(tasks)} tasks)")

    except Exception as e:
        logging.error(f"Sync failed: {e}")

# -----------------------------------
# Background Auto Sync
# -----------------------------------
SYNC_INTERVAL_MINUTES = 5

async def calendar_sync_loop():
    while True:
        logging.info("Starting background sync...")
        employees = employees_collection.find()
        for emp in employees:
            sync_employee_calendar(emp)
        logging.info("Sync complete.")
        await asyncio.sleep(SYNC_INTERVAL_MINUTES * 60)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(calendar_sync_loop())

# -----------------------------------

# GET All Employees with Pagination (Frontend Compatible)
@app.get("/employees")
def get_all_employees(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100)):
    employees = list(employees_collection.find({}, {"_id": 0}).skip(skip).limit(limit))
    logging.info(f"get_all_employees: found {len(employees)} employees in DB.")

    formatted = []
    for emp in employees:
        formatted.append({
            "id": emp["employee_id"],
            "employee_id": emp["employee_id"],
            "name": emp["name"],
            "role": emp["role"],
            "avatar": f"https://i.pravatar.cc/150?u={emp['employee_id']}",
            "skills": generate_mock_skills(emp["role"]),
            "tasks": emp.get("tasks", []),
            "is_burned_out": emp.get("is_burned_out", False)
        })

    return formatted

# -----------------------------------
# GET Single Employee Status
# -----------------------------------
@app.get("/status")
def get_status(employee_id: str):
    employee = employees_collection.find_one(
        {"employee_id": employee_id},
        {"_id": 0}
    )

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    return employee

# -----------------------------------
# Schedule Meeting
# -----------------------------------
@app.post("/schedule_meeting")
def schedule_meeting(payload: dict):
    employee = employees_collection.find_one(
        {"employee_id": payload["employee_id"]}
    )

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    service = get_calendar_service()

    event = {
        "summary": payload["summary"],
        "start": {"dateTime": payload["start"], "timeZone": "UTC"},
        "end": {"dateTime": payload["end"], "timeZone": "UTC"}
    }

    created = service.events().insert(
        calendarId=employee["calendar_email"],
        body=event
    ).execute()

    return {"message": "Meeting scheduled", "event_id": created["id"]}