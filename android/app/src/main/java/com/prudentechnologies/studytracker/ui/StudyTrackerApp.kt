package com.prudentechnologies.studytracker.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.prudentechnologies.studytracker.data.model.AppData
import com.prudentechnologies.studytracker.data.model.Lesson
import com.prudentechnologies.studytracker.ui.theme.PrudenBlue
import com.prudentechnologies.studytracker.ui.theme.PrudenRed

private enum class Screen(val title: String) {
    Dashboard("Dashboard"),
    Timetable("Timetable"),
    Units("Units"),
    Tasks("Tasks"),
    More("More")
}

@Composable
fun StudyTrackerApp(
    state: AppData?,
    onThemeToggle: () -> Unit,
    onSemesterChange: (String) -> Unit,
    onEnableLessonAlarms: () -> Unit
) {
    if (state == null) {
        Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
        return
    }

    var screen by remember { mutableStateOf(Screen.Dashboard) }
    var semesterMenu by remember { mutableStateOf(false) }

    val active = state.semesters.firstOrNull { it.id == state.activeSemesterId }
        ?: state.semesters.firstOrNull()
    val activeId = active?.id.orEmpty()
    val activeName = active?.name ?: "Set up your first semester"
    val activeUnits = state.units.filter { it.semesterId == activeId }
    val activeLessons = state.lessons.filter { it.semesterId == activeId }
    val activeTasks = state.tasks.filter { it.semesterId == activeId }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        PrudenMark()
                        Spacer(Modifier.width(9.dp))
                        Column {
                            Text(screen.title, fontWeight = FontWeight.Bold)
                            Text(
                                "PRUDEN TECHNOLOGIES",
                                fontSize = 9.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                actions = {
                    Box {
                        TextButton(onClick = { semesterMenu = true }) {
                            Text(activeName, color = PrudenBlue, fontWeight = FontWeight.Bold)
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                        DropdownMenu(
                            expanded = semesterMenu,
                            onDismissRequest = { semesterMenu = false }
                        ) {
                            state.semesters.forEach { semester ->
                                DropdownMenuItem(
                                    text = { Text(semester.name + " • " + semester.year) },
                                    onClick = {
                                        onSemesterChange(semester.id)
                                        semesterMenu = false
                                    }
                                )
                            }
                        }
                    }
                    IconButton(onClick = onThemeToggle) {
                        Icon(Icons.Default.Brightness4, contentDescription = "Theme")
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                val items = listOf(
                    Screen.Dashboard to Icons.Default.Home,
                    Screen.Timetable to Icons.Default.DateRange,
                    Screen.Units to Icons.Default.List,
                    Screen.Tasks to Icons.Default.CheckCircle,
                    Screen.More to Icons.Default.MoreVert
                )
                items.forEach { (item, icon) ->
                    NavigationBarItem(
                        selected = screen == item,
                        onClick = { screen = item },
                        icon = { Icon(icon, contentDescription = item.title) },
                        label = { Text(item.title) }
                    )
                }
            }
        }
    ) { padding ->
        when (screen) {
            Screen.Dashboard -> Dashboard(
                modifier = Modifier.padding(padding),
                state = state,
                activeLessons = activeLessons,
                activeUnits = activeUnits,
                activeTasks = activeTasks,
                activeSemesterName = active.name,
                onEnableLessonAlarms = onEnableLessonAlarms
            )
            Screen.Timetable -> Timetable(Modifier.padding(padding), state)
            Screen.Units -> Units(Modifier.padding(padding), state)
            Screen.Tasks -> Tasks(Modifier.padding(padding), activeTasks)
            Screen.More -> More(Modifier.padding(padding))
        }
    }
}

@Composable
private fun PrudenMark() {
    Box(
        Modifier
            .size(34.dp)
            .background(Color(0xFF0D2A4B), RoundedCornerShape(9.dp)),
        contentAlignment = Alignment.Center
    ) {
        Text("P", color = Color.White, fontWeight = FontWeight.Black, fontSize = 18.sp)
        Box(
            Modifier
                .align(Alignment.TopEnd)
                .offset(1.dp, (-1).dp)
                .size(7.dp)
                .background(PrudenRed, CircleShape)
        )
    }
}

@Composable
private fun Dashboard(
    modifier: Modifier,
    state: AppData,
    activeLessons: List<Lesson>,
    activeUnits: List<com.prudentechnologies.studytracker.data.model.UnitItem>,
    activeTasks: List<com.prudentechnologies.studytracker.data.model.TaskItem>,
    activeSemesterName: String,
    onEnableLessonAlarms: () -> Unit
) {
    val totalStudy = state.sessions
        .filter { it.semesterId == state.activeSemesterId }
        .sumOf { it.minutes }
    val openTasks = activeTasks.count { !it.done }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF0D1C30)
                )
            ) {
                Column(Modifier.padding(18.dp)) {
                    Text(
                        "PRUDEN TECHNOLOGIES • STUDENT OS",
                        color = PrudenBlue,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        activeSemesterName + " control center",
                        fontSize = 25.sp,
                        fontWeight = FontWeight.Black
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        "Classes, deadlines, attendance, grades and study in one place.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard("Units", activeUnits.size.toString(), Modifier.weight(1f))
                StatCard("Classes / week", activeLessons.size.toString(), Modifier.weight(1f))
            }
        }
        item {
            Row(
                Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    "Study time",
                    (totalStudy / 60).toString() + "h " + (totalStudy % 60) + "m",
                    Modifier.weight(1f)
                )
                StatCard("Open work", openTasks.toString(), Modifier.weight(1f))
            }
        }
        if (active == null) {
            item {
                Card {
                    Column(Modifier.padding(16.dp)) {
                        Text("FIRST RUN", color = PrudenBlue, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                        Spacer(Modifier.height(4.dp))
                        Text("Create your first semester", fontSize = 20.sp, fontWeight = FontWeight.Black)
                        Text(
                            "Your account is ready. Add a semester, then create your units and timetable.",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        item {
            OutlinedButton(
                onClick = onEnableLessonAlarms,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Notifications, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Enable lesson reminders")
            }
        }
        item {
            Text("Your timetable", fontWeight = FontWeight.Bold, fontSize = 18.sp)
        }
        items(activeLessons.take(5), key = { it.id }) { lesson ->
            val unit = state.units.firstOrNull { it.id == lesson.unitId }?.name ?: "Unit"
            Card {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(Modifier.width(92.dp)) {
                        Text(
                            lesson.start,
                            fontWeight = FontWeight.Black,
                            fontSize = 19.sp,
                            color = PrudenBlue
                        )
                        Text(lesson.day, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    Column {
                        Text(unit, fontWeight = FontWeight.Bold)
                        Text(
                            lesson.start + "–" + lesson.end + " • " + lesson.room,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(title: String, value: String, modifier: Modifier) {
    Card(modifier) {
        Column(Modifier.padding(14.dp)) {
            Text(title, color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 11.sp)
            Text(value, fontWeight = FontWeight.Black, fontSize = 22.sp)
        }
    }
}

@Composable
private fun Timetable(modifier: Modifier, state: AppData) {
    val grouped = state.lessons
        .filter { it.semesterId == state.activeSemesterId }
        .groupBy { it.day }

    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(9.dp)
    ) {
        item {
            Text("Weekly timetable", fontSize = 24.sp, fontWeight = FontWeight.Black)
        }
        listOf("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday").forEach { day ->
            item {
                val items = grouped[day].orEmpty().sortedBy { it.start }
                Card {
                    Column(Modifier.padding(12.dp)) {
                        Text(day, fontWeight = FontWeight.Bold)
                        if (items.isEmpty()) {
                            Text("Free", color = MaterialTheme.colorScheme.onSurfaceVariant, fontSize = 12.sp)
                        } else {
                            items.forEach { lesson ->
                                val unit = state.units.firstOrNull { it.id == lesson.unitId }?.name ?: "Unit"
                                Text(
                                    lesson.start + "–" + lesson.end + "  " + unit + " • " + lesson.room,
                                    fontSize = 12.sp,
                                    modifier = Modifier.padding(top = 5.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun Units(modifier: Modifier, state: AppData) {
    val units = state.units.filter { it.semesterId == state.activeSemesterId }
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { Text("Units", fontSize = 24.sp, fontWeight = FontWeight.Black) }
        items(units, key = { it.id }) {
            Card {
                Column(Modifier.padding(14.dp)) {
                    Text(it.name, fontWeight = FontWeight.Bold)
                    Text(
                        (it.code.ifBlank { "No code" }) + " • " + it.room,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        fontSize = 12.sp
                    )
                    Spacer(Modifier.height(7.dp))
                    Text(
                        "Self-study target: " + it.targetMinutes + " min",
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}

@Composable
private fun Tasks(
    modifier: Modifier,
    tasks: List<com.prudentechnologies.studytracker.data.model.TaskItem>
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        item { Text("Tasks & Assessments", fontSize = 24.sp, fontWeight = FontWeight.Black) }
        if (tasks.isEmpty()) {
            item {
                Text(
                    "No academic work recorded yet.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        items(tasks, key = { it.id }) { task ->
            Card {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        if (task.done) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                        contentDescription = null
                    )
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text(task.title, fontWeight = FontWeight.Bold)
                        Text(
                            task.type + " • due " + task.dueDate,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun More(modifier: Modifier) {
    val items = listOf(
        "Calendar", "Attendance", "Grades", "Study Sessions",
        "Focus Lab", "Notes", "Resources", "Analytics", "Semesters", "Settings"
    )
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item { Text("More", fontSize = 24.sp, fontWeight = FontWeight.Black) }
        items(items) { label ->
            Card {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .padding(15.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(label, fontWeight = FontWeight.SemiBold)
                    Spacer(Modifier.weight(1f))
                    Icon(Icons.Default.ChevronRight, contentDescription = null)
                }
            }
        }
    }
}
