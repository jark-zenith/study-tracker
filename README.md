# Study Tracker

A lightweight study planner for students to track sessions, monitor progress, and see subject trends.

## Features
- Add a study session with subject, duration, date, and type
- See total time, average session, and streak
- View a 7-day study chart
- Break down time by subject
- Delete sessions and keep local storage persistence
- Works instantly in the browser without installing complex dependencies

## Run it locally
1. Open `index.html` directly in your browser, or
2. From the project folder run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Files
- `index.html` — app layout
- `styles.css` — styling and dashboard look
- `app.js` — session logic and data management

## Idea
This is the first working MVP for the Study Tracker concept. It is intentionally fast and simple so you can use it today and expand it later with:
- user login
- goal tracking
- calendar view
- export to CSV
- charts and advanced analytics
- teacher or parent dashboard

If you want, the next version can add a backend, authentication, and a database.
