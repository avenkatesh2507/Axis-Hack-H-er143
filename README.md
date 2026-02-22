# Axis Manager Dashboard

Axis is a full-stack manager dashboard for employee and task management, featuring Google Calendar integration, MongoDB persistence, and a modern React UI.

## Features
- Employee list with infinite scroll
- Task board with persistent tasks
- Google Calendar sync for employees
- Manager dashboard with tabbed navigation
- Intro video loading page
- AI widget integration (ElevenLabs Convai)
- FastAPI backend with MongoDB Atlas
- Vite + React frontend with Tailwind CSS
- Ngrok tunnel for public API access

## Getting Started

### Backend
1. Install dependencies:
   ```bash
   cd Backend
   pip install -r requirements.txt
   ```
2. Add your Google API credentials to `credentials.json`.
3. Seed the database:
   ```bash
   python3 seed.py
   ```
4. Start the backend:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 9000
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd Frontend
   npm install
   ```
2. Start the frontend:
   ```bash
   npm run dev -- --port 9000
   ```
3. Open [http://localhost:9000](http://localhost:9000) in your browser.

### Ngrok (Optional)
Expose your backend API:
```bash
ngrok http 9000
```

## Project Structure
```
Backend/
  main.py
  db.py
  google_calendar.py
  seed.py
  ...
Frontend/
  src/
    App.jsx
    EmployeeList.jsx
    TaskBoard.jsx
    ...
  index.html
  vite.config.js
  ...
```

## Security
- Sensitive API keys are stored in `credentials.json` (not committed to GitHub).
- For production, use environment variables or secrets management.

## License
MIT

## Authors
- Aparna Venkatesh
- Contributors

---
For questions or issues, open an issue on [GitHub](https://github.com/avenkatesh2507/Axis-Hack-H-er143.git).
