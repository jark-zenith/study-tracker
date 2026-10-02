package com.prudentechnologies.studytracker.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.prudentechnologies.studytracker.data.model.AppData
import com.prudentechnologies.studytracker.data.repository.StudyTrackerRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class StudyTrackerViewModel(app: Application) : AndroidViewModel(app) {
    private val repo = StudyTrackerRepository(app)
    private val _state = MutableStateFlow<AppData?>(null)
    val state = _state.asStateFlow()

    init {
        viewModelScope.launch { _state.value = repo.load() }
    }

    fun setActiveSemester(id: String) {
        val current = _state.value ?: return
        val updated = current.copy(activeSemesterId = id)
        repo.save(updated)
        _state.value = updated
    }

    fun toggleTheme() {
        val current = _state.value ?: return
        val updated = current.copy(theme = if (current.theme == "dark") "light" else "dark")
        repo.save(updated)
        _state.value = updated
    }

    fun scheduleAllLessonReminders() {
        val current = _state.value ?: return
        val units = current.units.associateBy { it.id }
        current.lessons.forEach { lesson ->
            com.prudentechnologies.studytracker.notifications.LessonAlarmScheduler.schedule(
                getApplication(), lesson, units[lesson.unitId]?.name ?: "Lesson"
            )
        }
    }
}
