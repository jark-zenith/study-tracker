# Study Tracker Android

This is the native Android product layer for the Study Tracker repository.

## Open

Open the `android/` directory in Android Studio as a Gradle project.

Package:
`com.prudentechnologies.studytracker`

## Native stack

- Kotlin
- Jetpack Compose + Material 3
- MVVM + StateFlow
- SQLite local persistence foundation
- Native Android notifications
- Exact-alarm scheduling foundation
- Offline-first operation
- PRUDEN TECHNOLOGIES P mark

## Included now

- Android application module
- Gradle build configuration
- Native Compose shell
- Dashboard
- Timetable
- Units
- Tasks
- Semester selector
- Dark/light theme
- Semester 3 seed timetable
- Local SQLite application-state persistence
- Native lesson reminder scheduler
- Notification receiver
- Boot/time-change reminder restoration hook
- P-branded launcher vector
- Notification permission request
- Exact-alarm settings entry point

## Semester 3 seed

Operating System:
- Tuesday 08:00–10:00, L24
- Wednesday 08:00–10:00, L23
- Friday 08:00–10:00, L21

Computer Application II:
- Monday 10:15–12:00, L21
- Tuesday 10:15–12:00, L22
- Thursday 15:15–17:00, L15

Structured Programming:
- Tuesday 15:15–17:00, L20
- Thursday 10:15–12:00, L22

## Build status

This is the **Android project structure and native foundation**, not a claimed finished release APK. The repository includes GitHub Actions configuration to compile the module on future pushes.

Exact alarms are only scheduled when the required Android special access is available. Android's current guidance recommends checking that permission before using exact alarms. citeturn375822search1turn375822search5

## Next native build

- Complete all native feature screens
- Replace single JSON state bootstrap with full relational SQLite/Room schema
- Add full CRUD forms
- Add timetable import/merge
- Make alarm rescheduling transactional
- Connect Android sync to the existing REST backend
- Add release signing and generate APK/AAB
