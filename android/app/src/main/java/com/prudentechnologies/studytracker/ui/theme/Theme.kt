package com.prudentechnologies.studytracker.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val PrudenBlue = Color(0xFF3B82F6)
val PrudenRed = Color(0xFFEF4444)
val PrudenNavy = Color(0xFF07101D)

private val DarkColors = darkColorScheme(
    primary = PrudenBlue,
    secondary = Color(0xFF8FC0FF),
    background = PrudenNavy,
    surface = Color(0xFF0D1929)
)

private val LightColors = lightColorScheme(
    primary = Color(0xFF2563EB),
    secondary = Color(0xFF1D4ED8)
)

@Composable
fun StudyTrackerTheme(darkTheme: Boolean, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        typography = Typography(),
        content = content
    )
}
