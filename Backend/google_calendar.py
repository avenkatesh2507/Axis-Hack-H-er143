# google_calendar.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
import os

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    creds = None

    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds:
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        project_id = os.environ.get("GOOGLE_PROJECT_ID")
        if not client_id or not client_secret or not project_id:
            raise Exception("Missing Google API credentials in environment variables.")

        creds_data = {
            "installed": {
                "client_id": client_id,
                "project_id": project_id,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": client_secret,
                "redirect_uris": ["http://localhost"]
            }
        }

        import json
        creds_file = "env_credentials.json"
        with open(creds_file, "w") as f:
            json.dump(creds_data, f)

        flow = InstalledAppFlow.from_client_secrets_file(
            creds_file, SCOPES
        )
        creds = flow.run_local_server(port=0)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

        os.remove(creds_file)

    return build("calendar", "v3", credentials=creds)