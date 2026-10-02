package com.prudentechnologies.studytracker.data.repository

import android.content.Context
import com.prudentechnologies.studytracker.data.DefaultData
import com.prudentechnologies.studytracker.data.local.StudyTrackerDatabase
import com.prudentechnologies.studytracker.data.model.AppData
import com.prudentechnologies.studytracker.data.model.Lesson
import org.json.JSONArray
import org.json.JSONObject

class StudyTrackerRepository(context: Context) {
    private val db = StudyTrackerDatabase(context.applicationContext)

    @Volatile
    private var cache: AppData? = null

    fun load(): AppData {
        cache?.let { return it }
        val saved = db.readState()
        val data = runCatching { saved?.let(::decode) }.getOrNull() ?: DefaultData.initial().also { save(it) }
        cache = data
        return data
    }

    fun save(data: AppData) {
        cache = data
        db.writeState(encode(data))
    }

    fun getLessons(): List<Lesson> = load().lessons

    private fun encode(data: AppData): String {
        val root = JSONObject()
            .put("theme", data.theme)
            .put("activeSemesterId", data.activeSemesterId)
            .put("weeklyTargetMinutes", data.weeklyTargetMinutes)
            .put("semesterTargetMinutes", data.semesterTargetMinutes)

        fun semesters() = JSONArray().also { a ->
            data.semesters.forEach { s ->
                a.put(
                    JSONObject()
                        .put("id", s.id).put("name", s.name).put("year", s.year)
                        .put("start", s.start).put("end", s.end).put("status", s.status)
                )
            }
        }
        fun units() = JSONArray().also { a ->
            data.units.forEach { u ->
                a.put(
                    JSONObject()
                        .put("id", u.id).put("semesterId", u.semesterId).put("name", u.name)
                        .put("code", u.code).put("lecturer", u.lecturer).put("room", u.room)
                        .put("targetMinutes", u.targetMinutes)
                )
            }
        }
        fun lessons() = JSONArray().also { a ->
            data.lessons.forEach { l ->
                a.put(
                    JSONObject()
                        .put("id", l.id).put("semesterId", l.semesterId).put("unitId", l.unitId)
                        .put("day", l.day).put("start", l.start).put("end", l.end)
                        .put("room", l.room).put("reminderMinutes", l.reminderMinutes)
                )
            }
        }

        return root
            .put("semesters", semesters())
            .put("units", units())
            .put("lessons", lessons())
            .toString()
    }

    private fun decode(json: String): AppData {
        val root = JSONObject(json)
        val semesters = root.optJSONArray("semesters").toSemesters()
        val units = root.optJSONArray("units").toUnits()
        val lessons = root.optJSONArray("lessons").toLessons()
        return DefaultData.initial().copy(
            theme = root.optString("theme", "dark"),
            activeSemesterId = root.optString("activeSemesterId", semesters.firstOrNull()?.id ?: "sem3-2026"),
            semesters = if (semesters.isEmpty()) DefaultData.initial().semesters else semesters,
            units = if (units.isEmpty()) DefaultData.initial().units else units,
            lessons = if (lessons.isEmpty()) DefaultData.initial().lessons else lessons,
            weeklyTargetMinutes = root.optInt("weeklyTargetMinutes", 300),
            semesterTargetMinutes = root.optInt("semesterTargetMinutes", 7200)
        )
    }

    private fun JSONArray?.toSemesters() = this?.let { a ->
        (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            com.prudentechnologies.studytracker.data.model.Semester(
                o.getString("id"), o.getString("name"), o.getString("year"),
                o.getString("start"), o.getString("end"), o.optString("status", "planned")
            )
        }
    } ?: emptyList()

    private fun JSONArray?.toUnits() = this?.let { a ->
        (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            com.prudentechnologies.studytracker.data.model.UnitItem(
                o.getString("id"), o.getString("semesterId"), o.getString("name"),
                o.optString("code"), o.optString("lecturer"), o.optString("room"),
                o.optInt("targetMinutes", 1800)
            )
        }
    } ?: emptyList()

    private fun JSONArray?.toLessons() = this?.let { a ->
        (0 until a.length()).map { i ->
            val o = a.getJSONObject(i)
            Lesson(
                o.getString("id"), o.getString("semesterId"), o.getString("unitId"),
                o.getString("day"), o.getString("start"), o.getString("end"),
                o.optString("room"), o.optInt("reminderMinutes", 15)
            )
        }
    } ?: emptyList()
}
