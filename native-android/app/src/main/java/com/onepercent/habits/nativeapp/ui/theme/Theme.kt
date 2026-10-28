package com.onepercent.habits.nativeapp.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val OledDark = darkColorScheme(
    primary = Color(0xFF818CF8),
    onPrimary = Color(0xFF0F1020),
    secondary = Color(0xFFFBBF24),
    background = Color(0xFF000000),
    surface = Color(0xFF000000),
    surfaceVariant = Color(0xFF111111),
    onBackground = Color(0xFFF5F5F4),
    onSurface = Color(0xFFF5F5F4),
    onSurfaceVariant = Color(0xFFA3A3A3),
    outline = Color(0xFF1A1A1A),
    error = Color(0xFFFB7185),
)

private val Light = lightColorScheme(
    primary = Color(0xFF3730A3),
    onPrimary = Color(0xFFF8FAFC),
    secondary = Color(0xFFB45309),
    background = Color(0xFFE7E5E0),
    surface = Color(0xFFF6F5F2),
    surfaceVariant = Color(0xFFEFECE6),
    onBackground = Color(0xFF1C1917),
    onSurface = Color(0xFF1C1917),
    onSurfaceVariant = Color(0xFF78716C),
    outline = Color(0xFFE3DFD6),
    error = Color(0xFFBE123C),
)

@Composable
fun OnePercentTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit,
) {
    MaterialTheme(
        colorScheme = if (darkTheme) OledDark else Light,
        content = content,
    )
}
