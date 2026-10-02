package com.prudentechnologies.studytracker.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.prudentechnologies.studytracker.data.repository.StudyTrackerRepository

class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_BOOT_COMPLETED &&
            intent.action != Intent.ACTION_TIME_SET &&
            intent.action != Intent.ACTION_TIMEZONE_CHANGED) return

        val repo = StudyTrackerRepository(context)
        val data = repo.load()
        val units = data.units.associateBy { it.id }
        data.lessons.forEach { lesson ->
            LessonAlarmScheduler.schedule(context, lesson, units[lesson.unitId]?.name ?: "Lesson")
        }
    }
}
