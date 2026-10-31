package com.onepercent.habits.nativeapp

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.Density
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.onepercent.habits.nativeapp.data.HabitEntity
import com.onepercent.habits.nativeapp.ui.HabitEditorScreen
import com.onepercent.habits.nativeapp.ui.AuditScreen
import com.onepercent.habits.nativeapp.ui.HabitsViewModel
import com.onepercent.habits.nativeapp.ui.HomeScreen
import com.onepercent.habits.nativeapp.ui.SettingsScreen
import com.onepercent.habits.nativeapp.ui.StatusScreen
import com.onepercent.habits.nativeapp.ui.theme.OnePercentTheme

class MainActivity : ComponentActivity() {
    private val vm: HabitsViewModel by viewModels()
    private val settingsPrefs by lazy { getSharedPreferences("app_settings", MODE_PRIVATE) }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { /* user response */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        vm.setVisibleDays(settingsPrefs.getInt("visible_days", 4))
        requestNotifPermission()
        vm.refreshAlarms()

        setContent {
            var dark by remember { mutableStateOf(settingsPrefs.getBoolean("dark_theme", true)) }
            var fontScale by remember { mutableStateOf(settingsPrefs.getFloat("font_scale", 1.0f).coerceIn(0.6f, 1.0f)) }
            var visibleDays by remember { mutableStateOf(settingsPrefs.getInt("visible_days", 4).coerceIn(1, 7)) }
            var wakeUpTime by remember { mutableStateOf(settingsPrefs.getString("wake_up_time", "05:00") ?: "05:00") }
            var sleepTime by remember { mutableStateOf(settingsPrefs.getString("sleep_time", "21:00") ?: "21:00") }
            var screen by remember { mutableStateOf<Screen>(Screen.Home) }
            val systemDensity = LocalDensity.current

            BackHandler(enabled = screen != Screen.Home) { screen = Screen.Home }

            CompositionLocalProvider(
                LocalDensity provides Density(
                    density = systemDensity.density * fontScale,
                    fontScale = systemDensity.fontScale,
                ),
            ) {
                OnePercentTheme(darkTheme = dark) {
                    when (val s = screen) {
                        Screen.Home -> HomeScreen(
                            vm = vm,
                            wakeUpTime = wakeUpTime,
                            sleepTime = sleepTime,
                            onAdd = { start, end -> screen = Screen.Edit(null, start, end) },
                            onEdit = { screen = Screen.Edit(it) },
                            onOpenStatus = { id, date -> screen = Screen.Status(id, date) },
                            onSettings = { screen = Screen.Settings },
                            onCopyLogs = { screen = Screen.Audit },
                        )
                        is Screen.Edit -> HabitEditorScreen(
                            existing = s.habit,
                            allowedStart = s.allowedStart,
                            allowedEnd = s.allowedEnd,
                            onSave = { id, name, q, start, end, remind, days, freqType, freqDays, freqNum, freqDates, color ->
                                vm.saveHabit(id, name, q, start, end, remind, days, freqType, freqDays, freqNum, freqDates, color)
                                screen = Screen.Home
                            },
                            onDelete = { id ->
                                vm.deleteHabit(id)
                                screen = Screen.Home
                            },
                            onClose = { screen = Screen.Home },
                        )
                        is Screen.Status -> StatusScreen(
                            habitId = s.habitId,
                            dateKey = s.dateKey,
                            vm = vm,
                            onClose = { screen = Screen.Home },
                        )
                        Screen.Audit -> AuditScreen(vm = vm, onClose = { screen = Screen.Home })
                        Screen.Settings -> SettingsScreen(
                            dark = dark,
                            onToggleDark = {
                                dark = it
                                settingsPrefs.edit().putBoolean("dark_theme", it).apply()
                            },
                            fontScale = fontScale,
                            onFontScaleChange = {
                                fontScale = it.coerceIn(0.6f, 1.0f)
                                settingsPrefs.edit().putFloat("font_scale", fontScale).apply()
                            },
                            visibleDays = visibleDays,
                            onVisibleDaysChange = {
                                visibleDays = it.coerceIn(1, 7)
                                settingsPrefs.edit().putInt("visible_days", visibleDays).apply()
                                vm.setVisibleDays(visibleDays)
                            },
                            wakeUpTime = wakeUpTime,
                            onWakeUpTimeChange = {
                                wakeUpTime = it
                                settingsPrefs.edit().putString("wake_up_time", it).apply()
                            },
                            sleepTime = sleepTime,
                            onSleepTimeChange = {
                                sleepTime = it
                                settingsPrefs.edit().putString("sleep_time", it).apply()
                            },
                            vm = vm,
                            onClose = { screen = Screen.Home },
                        )
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        vm.refreshAlarms()
    }

    private fun requestNotifPermission() {
        if (Build.VERSION.SDK_INT >= 33) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
    }
}

private sealed class Screen {
    data object Home : Screen()
    data class Edit(val habit: HabitEntity?, val allowedStart: String = "05:00", val allowedEnd: String = "21:00") : Screen()
    data class Status(val habitId: String, val dateKey: String) : Screen()
    data object Settings : Screen()
    data object Audit : Screen()
}
