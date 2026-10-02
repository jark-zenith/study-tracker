package com.prudentechnologies.studytracker

import android.Manifest
import android.app.AlarmManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.getValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.prudentechnologies.studytracker.ui.StudyTrackerApp
import com.prudentechnologies.studytracker.ui.theme.StudyTrackerTheme
import com.prudentechnologies.studytracker.viewmodel.StudyTrackerViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: StudyTrackerViewModel by viewModels()

    private val notificationPermission = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= 33) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }

        setContent {
            val state by viewModel.state.collectAsStateWithLifecycle()
            StudyTrackerTheme(darkTheme = state?.theme != "light") {
                StudyTrackerApp(
                    state = state,
                    onThemeToggle = viewModel::toggleTheme,
                    onSemesterChange = viewModel::setActiveSemester,
                    onEnableLessonAlarms = ::openExactAlarmSettings
                )
            }
        }
    }

    private fun openExactAlarmSettings() {
        if (Build.VERSION.SDK_INT >= 31) {
            val manager = getSystemService(AlarmManager::class.java)
            if (!manager.canScheduleExactAlarms()) {
                startActivity(
                    Intent(
                        Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                        Uri.parse("package:$packageName")
                    )
                )
            } else {
                viewModel.scheduleAllLessonReminders()
            }
        } else {
            viewModel.scheduleAllLessonReminders()
        }
    }
}
