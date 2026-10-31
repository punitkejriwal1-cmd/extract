package com.onepercent.habits.nativeapp.ui

import android.app.TimePickerDialog
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.padding
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import com.onepercent.habits.nativeapp.data.HabitEntity
import java.util.Calendar

private val DAY_LABELS = listOf("Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday")
private val COLORS = listOf(0xFF8B5CF6, 0xFF38BDF8, 0xFFF97316, 0xFF22C55E, 0xFFF87171)

private fun displayTime(value: String): String {
    val parts = value.split(":")
    if (parts.size < 2) return value
    val hour = parts[0].toIntOrNull() ?: return value
    val minute = parts[1].toIntOrNull() ?: return value
    val suffix = if (hour >= 12) "PM" else "AM"
    val hour12 = when (hour % 12) { 0 -> 12; else -> hour % 12 }
    return "%d:%02d %s".format(hour12, minute, suffix)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HabitEditorScreen(
    existing: HabitEntity?,
    allowedStart: String = "05:00",
    allowedEnd: String = "21:00",
    onSave: (
        id: String?, name: String, question: String, startTime: String, endTime: String,
        reminderTime: String, reminderDays: String, freqType: String, freqDays: String,
        freqNum: Int, freqDates: String, color: Long,
    ) -> Unit,
    onDelete: (String) -> Unit,
    onClose: () -> Unit,
) {
    val context = LocalContext.current
    var name by remember(existing?.id) { mutableStateOf(existing?.name.orEmpty()) }
    var question by remember(existing?.id) { mutableStateOf(existing?.question.orEmpty()) }
    var start by remember(existing?.id, allowedStart) { mutableStateOf(existing?.startTime ?: allowedStart) }
    var end by remember(existing?.id, allowedEnd) { mutableStateOf(existing?.endTime ?: allowedEnd) }
    var remind by remember(existing?.id) { mutableStateOf(existing?.reminderTime ?: "09:00") }
    var days by remember(existing?.id) {
        mutableStateOf(existing?.reminderDays?.split(",")?.mapNotNull { it.trim().toIntOrNull() }?.toSet() ?: (0..6).toSet())
    }
    var color by remember(existing?.id) { mutableStateOf(existing?.color ?: COLORS.first()) }
    var validation by remember(existing?.id) { mutableStateOf<String?>(null) }

    fun chooseTime(current: String, onSelected: (String) -> Unit) {
        val parts = current.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull()?.coerceIn(0, 23) ?: 9
        val minute = parts.getOrNull(1)?.toIntOrNull()?.coerceIn(0, 59) ?: 0
        TimePickerDialog(context, { _, selectedHour, selectedMinute ->
            onSelected("%02d:%02d".format(selectedHour, selectedMinute))
        }, hour, minute, false).show()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (existing == null) "Create habit" else "Edit habit") },
                navigationIcon = {
                    IconButton(onClick = onClose) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
            )
        },
    ) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).imePadding().padding(16.dp).verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            OutlinedTextField(value = name, onValueChange = { name = it.take(65) }, label = { Text("Name") }, singleLine = true, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = question, onValueChange = { question = it.take(65) }, label = { Text("Question (optional)") }, singleLine = true, modifier = Modifier.fillMaxWidth())

            Text("Session time (display only)", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(onClick = { chooseTime(start) { start = it } }, modifier = Modifier.weight(1f)) {
                    Text("Starts: ${displayTime(start)}")
                }
                OutlinedButton(onClick = { chooseTime(end) { end = it } }, modifier = Modifier.weight(1f)) {
                    Text("Ends: ${displayTime(end)}")
                }
            }

            Text("Activity colour", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                COLORS.forEachIndexed { index, value ->
                    Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                        Box(Modifier.size(38.dp).clip(CircleShape).background(Color(value)).clickable { color = value })
                        Text(listOf("Purple", "Sky blue", "Orange", "Green", "Light red")[index], style = MaterialTheme.typography.labelSmall)
                    }
                }
            }
            validation?.let { Text(it, color = MaterialTheme.colorScheme.error) }

            Text("Reminder time", style = MaterialTheme.typography.labelLarge)
            OutlinedButton(onClick = { chooseTime(remind) { remind = it } }, modifier = Modifier.fillMaxWidth()) {
                Text("Remind me at  ${displayTime(remind)}")
            }

            Text("Reminder days", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp), modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState())) {
                DAY_LABELS.forEachIndexed { i, label ->
                    FilterChip(
                        selected = i in days,
                        onClick = { days = if (i in days) days - i else days + i },
                        label = { Text(label) },
                    )
                }
            }

            Spacer(Modifier.height(4.dp))
            Button(
                onClick = {
                    if (name.isBlank()) return@Button
                    val a = start.split(":").let { it[0].toInt() * 60 + it[1].toInt() }
                    val b = end.split(":").let { it[0].toInt() * 60 + it[1].toInt() }
                    val min = allowedStart.split(":").let { it[0].toInt() * 60 + it[1].toInt() }
                    val max = allowedEnd.split(":").let { it[0].toInt() * 60 + it[1].toInt() }
                    if (a < min || b > max || b <= a) {
                        validation = "Activity must fit within ${displayTime(allowedStart)}–${displayTime(allowedEnd)}."
                        return@Button
                    }
                    validation = null
                    onSave(
                        existing?.id, name.trim(), question.trim(),
                        start.ifBlank { "09:00" }, end,
                        remind.ifBlank { start.ifBlank { "09:00" } },
                        days.sorted().joinToString(","),
                        existing?.freqType ?: "daily",
                        existing?.freqDays ?: "0,1,2,3,4,5,6",
                        existing?.freqNum ?: 2,
                        existing?.freqDates.orEmpty(),
                        color,
                    )
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text("Save habit") }

            if (existing != null) {
                OutlinedButton(onClick = { onDelete(existing.id) }, modifier = Modifier.fillMaxWidth()) { Text("Delete") }
            }
        }
    }
}
