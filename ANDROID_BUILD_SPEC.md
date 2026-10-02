# Android Build Specification

Study Tracker is deliberately modeled so the web product can become a native Android application without changing the academic concepts.

## Native target

- Kotlin
- Jetpack Compose
- Room database
- Android Notification APIs
- AlarmManager for exact lesson reminder scheduling where appropriate
- Material 3 UI
- Offline-first, no account required for the first Android release

## Core data

Semester -> Units -> Lessons
Semester -> Tasks / Assessments
Semester -> Attendance
Semester -> Grades
Semester -> Study Sessions
Semester -> Notes
Semester -> Resources
Semester -> Calendar Events
Global -> Profile / Preferences / Goals

## Android screens

1. Dashboard
2. Timetable
3. Calendar
4. Units
5. Tasks & Assessments
6. Attendance
7. Grades
8. Study Sessions
9. Focus Lab
10. Notes
11. Resources
12. Analytics
13. Semesters
14. Settings

## Lesson reminders

Every lesson stores day, start time, end time, room and reminder minutes. Android should create/cancel alarms when a lesson changes and show the unit, start time and room in the notification.

## Future import

Design an import service that can accept JSON/CSV first, then PDF/image timetable parsing later. Imported data must be previewed before replacing or merging an existing semester schedule.

## Future AI

AI is an optional intelligence layer over local academic data. It should not be required for the core app to work. Candidate features include revision planning, weak-unit detection, study-plan generation and natural-language timetable queries.
