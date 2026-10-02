package com.prudentechnologies.studytracker.data

import com.prudentechnologies.studytracker.data.model.*

object DefaultData {
    fun initial() = AppData(
        activeSemesterId = "",
        semesters = emptyList(),
        units = emptyList(),
        lessons = emptyList(),
        tasks = emptyList(),
        attendance = emptyList(),
        grades = emptyList(),
        sessions = emptyList(),
        notes = emptyList(),
        resources = emptyList(),
        events = emptyList()
    )
}
