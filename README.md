# Study Tracker

Study Tracker is a local-first student operating system by PRUDEN TECHNOLOGIES.

It is designed to grow with a student across every semester instead of becoming a one-semester timetable app.

## Product scope

### Academic management
- Multiple semesters with start/end dates and switching
- Units with room, lecturer, code and independent-study targets
- Recurring weekly timetable
- Editable lesson times, rooms and reminder minutes
- Assignments, CATs, tests, exams, projects and revision work
- Attendance tracking by unit
- Assessment grade recording
- Calendar events and deadlines

### Study intelligence
- Study-session logging
- Weekly and semester study targets
- Focus Lab timer
- Study effort by unit
- Attendance, task-completion and grade analytics
- Notes
- Saved learning resources and links

### Platform
- Local-first browser storage
- JSON backup export/import
- Optional Express REST backend
- SQLite persistence
- Optional sync-key protection for backend state
- PWA manifest and service worker
- Responsive mobile/desktop interface
- Pruden Technologies P mark

## Semester 3 seed

The current timetable is preloaded for the October–December 2026 semester:

- Operating System — Tuesday 08:00–10:00 L24; Wednesday 08:00–10:00 L23; Friday 08:00–10:00 L21
- Computer Application II — Monday 10:15–12:00 L21; Tuesday 10:15–12:00 L22; Thursday 15:15–17:00 L15
- Structured Programming — Tuesday 15:15–17:00 L20; Thursday 10:15–12:00 L22

## Run locally

Install Node.js, then:

npm install
npm start

Open http://localhost:3000.

The app still works as a local browser app when opened directly, although backend sync and service-worker features require serving it over HTTP.

## Backend API

- GET /api/health — health/version/status
- GET /api/state — load persisted application state
- PUT /api/state — persist the application state

When STUDY_TRACKER_SYNC_KEY is set, send it as the x-sync-key request header.

## Render

A render.yaml blueprint is included. Set STUDY_TRACKER_SYNC_KEY to a random private value in Render before enabling server sync.

## Android

Native Android project foundation: open the `android/` directory in Android Studio. It contains the Kotlin/Compose app shell, Pruden Technologies P branding, local persistence foundation, lesson reminder scheduler, and Android build CI.

## Roadmap

1. Native Android app using Kotlin + Jetpack Compose + Room
2. Native Android lesson alarms and notification channels
3. Timetable import from CSV/JSON, then PDF/image parsing
4. AI study assistant and adaptive revision planning
5. Optional secure multi-device account/cloud sync
6. Optional institution/teacher mode

The current web system is the product foundation; Android can consume the same semester data model without redesigning the academic concepts.
