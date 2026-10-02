package com.prudentechnologies.studytracker.notifications

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.prudentechnologies.studytracker.data.model.Lesson
import java.util.Calendar

object LessonAlarmScheduler {
    private val days = listOf("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday")

    fun schedule(context: Context, lesson: Lesson, unitName: String) {
        val alarmManager = context.getSystemService(AlarmManager::class.java)
        if (android.os.Build.VERSION.SDK_INT >= 31 && !alarmManager.canScheduleExactAlarms()) return

        val dayIndex = days.indexOf(lesson.day)
        if (dayIndex < 0) return
        val parts = lesson.start.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull() ?: return
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: return

        val now = Calendar.getInstance()
        val cal = Calendar.getInstance().apply {
            set(Calendar.SECOND,0)
            set(Calendar.MILLISECOND,0)
            set(Calendar.HOUR_OF_DAY,hour)
            set(Calendar.MINUTE,minute)
        }
        val currentDayIndex = (now.get(Calendar.DAY_OF_WEEK) + 5) % 7
        var delta = (dayIndex - currentDayIndex + 7) % 7
        cal.add(Calendar.DAY_OF_YEAR, delta)
        cal.add(Calendar.MINUTE, -lesson.reminderMinutes)
        if (cal.timeInMillis <= now.timeInMillis + 30000) cal.add(Calendar.DAY_OF_YEAR,7)

        val intent = Intent(context, LessonAlarmReceiver::class.java).apply {
            putExtra("lessonId",lesson.id)
            putExtra("unit",unitName)
            putExtra("start",lesson.start)
            putExtra("room",lesson.room)
            putExtra("day",lesson.day)
            putExtra("reminderMinutes",lesson.reminderMinutes)
        }
        val pending = PendingIntent.getBroadcast(
            context, lesson.id.hashCode(), intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,cal.timeInMillis,pending)
    }

    fun cancel(context: Context, lessonId: String) {
        val intent = Intent(context, LessonAlarmReceiver::class.java)
        val pending = PendingIntent.getBroadcast(
            context, lessonId.hashCode(), intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pending != null) context.getSystemService(AlarmManager::class.java).cancel(pending)
    }
}
