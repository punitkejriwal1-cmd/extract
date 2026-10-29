package com.onepercent.habits.nativeapp.ui

import android.app.TimePickerDialog
import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.unit.dp
import androidx.core.content.FileProvider
import kotlinx.coroutines.launch
import java.io.File

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    dark: Boolean,
    onToggleDark: (Boolean) -> Unit,
    fontScale: Float,
    onFontScaleChange: (Float) -> Unit,
    visibleDays: Int,
    onVisibleDaysChange: (Int) -> Unit,
    wakeUpTime: String,
    onWakeUpTimeChange: (String) -> Unit,
    sleepTime: String,
    onSleepTimeChange: (String) -> Unit,
    vm: HabitsViewModel,
    onClose: () -> Unit,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var message by remember { mutableStateOf<String?>(null) }

    val importLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.OpenDocument(),
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        try {
            val text = context.contentResolver.openInputStream(uri)?.bufferedReader()?.readText()
            if (text != null) {
                vm.importJson(text) { ok ->
                    message = if (ok) "Import successful" else "Import failed"
                }
            }
        } catch (_: Exception) {
            message = "Import failed"
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier
                .padding(padding)
                .imePadding()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Theme", style = MaterialTheme.typography.titleMedium)
            Text("Dark uses pure black for OLED.", style = MaterialTheme.typography.bodySmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = dark,
                    onClick = { onToggleDark(true) },
                    label = { Text("Dark (OLED)") },
                )
                FilterChip(
                    selected = !dark,
                    onClick = { onToggleDark(false) },
                    label = { Text("Light") },
                )
            }

            Text("Text size", style = MaterialTheme.typography.titleMedium)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text("Habit text")
                Text("${(fontScale * 100).toInt()}%", color = MaterialTheme.colorScheme.primary)
            }
            Slider(
                value = fontScale.coerceIn(0.6f, 1.0f),
                onValueChange = onFontScaleChange,
                valueRange = 0.6f..1.0f,
                steps = 7,
            )

            Text("Days on home", style = MaterialTheme.typography.titleMedium)
            Text(
                when (visibleDays) {
                    1 -> "Only today is shown."
                    else -> "Today and the previous ${visibleDays - 1} day${if (visibleDays == 2) "" else "s"}."
                },
                style = MaterialTheme.typography.bodySmall,
            )
            Row(
                modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                (1..7).forEach { count ->
                    FilterChip(
                        selected = visibleDays == count,
                        onClick = { onVisibleDaysChange(count) },
                        label = { Text(count.toString()) },
                    )
                }
            }

            Text("Daily schedule", style = MaterialTheme.typography.titleMedium)
            Text("These times define the first and last blocks of your timetable.", style = MaterialTheme.typography.bodySmall)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = {
                    val p = wakeUpTime.split(":")
                    TimePickerDialog(context, { _, h, m -> onWakeUpTimeChange("%02d:%02d".format(h, m)) },
                        p.getOrNull(0)?.toIntOrNull() ?: 5, p.getOrNull(1)?.toIntOrNull() ?: 0, false).show()
                }, modifier = Modifier.weight(1f)) { Text("Wake-up: ${displayTime(wakeUpTime)}") }
                OutlinedButton(onClick = {
                    val p = sleepTime.split(":")
                    TimePickerDialog(context, { _, h, m -> onSleepTimeChange("%02d:%02d".format(h, m)) },
                        p.getOrNull(0)?.toIntOrNull() ?: 21, p.getOrNull(1)?.toIntOrNull() ?: 0, false).show()
                }, modifier = Modifier.weight(1f)) { Text("Sleep: ${displayTime(sleepTime)}") }
            }

            Text("Backup", style = MaterialTheme.typography.titleMedium)
            Text(
                "Export saves a JSON file. Import restores habits after reinstall.",
                style = MaterialTheme.typography.bodySmall,
            )
            Button(
                onClick = {
                    scope.launch {
                        try {
                            val json = vm.exportJson()
                            val file = File(context.cacheDir, "1percent-habits-backup.json")
                            file.writeText(json)
                            val uri = FileProvider.getUriForFile(
                                context,
                                "${context.packageName}.fileprovider",
                                file,
                            )
                            val share = Intent(Intent.ACTION_SEND).apply {
                                type = "application/json"
                                putExtra(Intent.EXTRA_STREAM, uri)
                                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                            }
                            context.startActivity(Intent.createChooser(share, "Save habits backup"))
                            message = "Share sheet opened"
                        } catch (_: Exception) {
                            message = "Export failed"
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Export JSON")
            }
            OutlinedButton(
                onClick = { importLauncher.launch(arrayOf("application/json", "text/*", "*/*")) },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Import JSON")
            }

            message?.let { Text(it, color = MaterialTheme.colorScheme.primary) }
        }
    }
}


private fun displayTime(value: String): String {
    val p = value.split(":")
    val hour = p.getOrNull(0)?.toIntOrNull() ?: return value
    val minute = p.getOrNull(1)?.toIntOrNull() ?: return value
    val suffix = if (hour >= 12) "PM" else "AM"
    val h12 = when (hour % 12) { 0 -> 12; else -> hour % 12 }
    return "%d:%02d %s".format(h12, minute, suffix)
}
