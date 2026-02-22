from fastapi import FastAPI, HTTPException
from db import employees_collection
from google_calendar import get_calendar_service
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
import asyncio
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)

# --- Configuration & Background Logic ---

SYNC_INTERVAL_MINUTES = 5 

def sync_employee_calendar(employee):
    service = get_calendar_service()
    calendar_id = employee['calendar_email']
    
    # Use timezone-aware UTC now
    now = datetime.now(timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(hours=23, minutes=59, seconds=59)

    try:
        # Google expects Z for UTC. .isoformat() on a TZ-aware object adds +00:00.
        # We replace that with Z to ensure Google's API doesn't throw a 400 error.
        time_min = start_of_day.isoformat().replace("+00:00", "Z")
        time_max = end_of_day.isoformat().replace("+00:00", "Z")

        events_result = service.events().list(
            calendarId=calendar_id,
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True
        ).execute()

        events = events_result.get('items', [])
        tasks = []
        for event in events:
            tasks.append({
                "title": event.get('summary', 'No Title'),
                "start": event['start'].get('dateTime', event['start'].get('date')),
                "end": event['end'].get('dateTime', event['end'].get('date')),
                "source": "google_calendar"
            })

        is_burned_out = len(tasks) > 5

        employees_collection.update_one(
            {"employee_id": employee['employee_id']},
            {
                "$set": {
                    "tasks": tasks,
                    "is_burned_out": is_burned_out,
                    "last_synced": datetime.now(timezone.utc)
                }
            }
        )
        logging.info(f"SUCCESS: {employee['name']} synced ({len(tasks)} tasks). Burnout: {is_burned_out}")
    except Exception as e:
        logging.error(f"FAILED: Error syncing {employee.get('name', 'Unknown')}: {e}")

async def calendar_sync_loop():
    while True:
        logging.info(f"--- Starting automatic calendar sync cycle ---")
        employees = list(employees_collection.find())
        if not employees:
            logging.warning("No employees found in database to sync.")
        
        for emp in employees:
            sync_employee_calendar(emp)
            
        logging.info(f"--- Sync cycle complete. Waiting {SYNC_INTERVAL_MINUTES} minutes ---")
        await asyncio.sleep(SYNC_INTERVAL_MINUTES * 60)

# --- Lifespan Manager ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run the background sync loop
    sync_task = asyncio.create_task(calendar_sync_loop())
    yield
    # Shutdown: Stop the task cleanly
    sync_task.cancel()

# --- App Instance ---

app = FastAPI(title="Axis API", lifespan=lifespan)

# --- Routes ---

@app.get("/status/{employee_id}")
def get_status(employee_id: str):
    employee = employees_collection.find_one({"employee_id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@app.post("/schedule_meeting")
def schedule_meeting(payload: dict):
    """
    payload example:
    {
        "employee_id": "AX-001",
        "summary": "Team Sync",
        "start": "2026-02-22T14:00:00",
        "end": "2026-02-22T15:00:00"
    }
    """
    employee = employees_collection.find_one({"employee_id": payload['employee_id']})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    service = get_calendar_service()
    event = {
        'summary': payload['summary'],
        'start': {'dateTime': payload['start'], 'timeZone': 'UTC'},
        'end': {'dateTime': payload['end'], 'timeZone': 'UTC'}
    }

    try:
        created_event = service.events().insert(calendarId=employee['calendar_email'], body=event).execute()
        logging.info(f"Meeting '{created_event['summary']}' scheduled for {employee['name']}")
        return {"message": f"Meeting scheduled.", "id": created_event['id']}
    except Exception as e:
        logging.error(f"Scheduling error: {e}")
        raise HTTPException(status_code=500, detail=str(e))