package com.prudentechnologies.studytracker.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import com.prudentechnologies.studytracker.R

class LessonAlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val manager = context.getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(
            NotificationChannel("lesson_reminders",context.getString(R.string.notification_channel_name),NotificationManager.IMPORTANCE_HIGH)
        )

        val unit = intent.getStringExtra("unit") ?: "Upcoming lesson"
        val start = intent.getStringExtra("start") ?: ""
        val room = intent.getStringExtra("room") ?: "Room not set"

        val n = NotificationCompat.Builder(context,"lesson_reminders")
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle("Upcoming lesson")
            .setContentText("$unit starts at $start • $room")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        manager.notify(intent.getStringExtra("lessonId")?.hashCode() ?: 1001,n)

        val lessonId = intent.getStringExtra("lessonId") ?: return
        val reminder = intent.getIntExtra("reminderMinutes",15)
        val day = intent.getStringExtra("day") ?: return
        val startTime = intent.getStringExtra("start") ?: return
        val parts = startTime.split(":")
        val h = parts.getOrNull(0)?.toIntOrNull() ?: return
        val m = parts.getOrNull(1)?.toIntOrNull() ?: return
        val days = listOf("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday")
        val target = days.indexOf(day)
        if(target < 0) return
        val now=java.util.Calendar.getInstance()
        val current=(now.get(java.util.Calendar.DAY_OF_WEEK)+5)%7
        var delta=(target-current+7)%7
        val next=java.util.Calendar.getInstance().apply{
            set(java.util.Calendar.SECOND,0);set(java.util.Calendar.MILLISECOND,0)
            set(java.util.Calendar.HOUR_OF_DAY,h);set(java.util.Calendar.MINUTE,m)
            add(java.util.Calendar.DAY_OF_YEAR,delta)
            add(java.util.Calendar.MINUTE,-reminder)
        }
        if(next.timeInMillis<=System.currentTimeMillis()+30000) next.add(java.util.Calendar.DAY_OF_YEAR,7)

        val nextIntent=Intent(context,LessonAlarmReceiver::class.java).apply{
            putExtra("lessonId",lessonId);putExtra("unit",unit);putExtra("start",startTime)
            putExtra("room",room);putExtra("day",day);putExtra("reminderMinutes",reminder)
        }
        val pending=android.app.PendingIntent.getBroadcast(context,lessonId.hashCode(),nextIntent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT or android.app.PendingIntent.FLAG_IMMUTABLE)
        context.getSystemService(android.app.AlarmManager::class.java).setExactAndAllowWhileIdle(
            android.app.AlarmManager.RTC_WAKEUP,next.timeInMillis,pending)
    }
}
