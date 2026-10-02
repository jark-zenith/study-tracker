package com.prudentechnologies.studytracker.data

import com.prudentechnologies.studytracker.data.model.*

object DefaultData {
    val semester = Semester("sem3-2026","Semester 3","2026","2026-10-01","2026-12-31","active")
    val units = listOf(
        UnitItem("u-os","sem3-2026","Operating System",room="L24"),
        UnitItem("u-ca2","sem3-2026","Computer Application II",room="L21"),
        UnitItem("u-sp","sem3-2026","Structured Programming",room="L20")
    )
    val lessons = listOf(
        Lesson("l1","sem3-2026","u-os","Tuesday","08:00","10:00","L24"),
        Lesson("l2","sem3-2026","u-os","Wednesday","08:00","10:00","L23"),
        Lesson("l3","sem3-2026","u-os","Friday","08:00","10:00","L21"),
        Lesson("l4","sem3-2026","u-ca2","Monday","10:15","12:00","L21"),
        Lesson("l5","sem3-2026","u-ca2","Tuesday","10:15","12:00","L22"),
        Lesson("l6","sem3-2026","u-ca2","Thursday","15:15","17:00","L15"),
        Lesson("l7","sem3-2026","u-sp","Tuesday","15:15","17:00","L20"),
        Lesson("l8","sem3-2026","u-sp","Thursday","10:15","12:00","L22")
    )
    fun initial() = AppData(
        activeSemesterId = semester.id,
        semesters = listOf(semester),
        units = units,
        lessons = lessons,
        tasks = emptyList(),
        attendance = emptyList(),
        grades = emptyList(),
        sessions = emptyList(),
        notes = emptyList(),
        resources = emptyList(),
        events = emptyList()
    )
}
