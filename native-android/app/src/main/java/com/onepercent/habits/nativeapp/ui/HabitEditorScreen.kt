package com.onepercent.habits.nativeapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
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
import androidx.compose.ui.unit.dp
import com.onepercent.habits.nativeapp.data.HabitEntity

private val DAY_LABELS = listOf("S", "M", "T", "W", "T", "F", "S")
private val COLORS = listOf(
    0xFF3B82F6, 0xFFEC4899, 0xFFA78B6D, 0xFF22C55E,
    0xFF64748B, 0xFF8B5CF6, 0xFFF59E0B, 0xFF06B6D4,
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HabitEditorScreen(
    existing: HabitEntity?,
    onSave: (
        id: String?,
        name: String,
        question: String,
        startTime: String,
        endTime: String,
        reminderTime: String,
        reminderDays: String,
        color: Long,
    ) -> Unit,
    onDelete: (String) -> Unit,
    onClose: () -> Unit,
) {
    var name by remember { mutableStateOf(existing?.name.orEmpty()) }
    var question by remember { mutableStateOf(existing?.question.orEmpty()) }
    var start by remember { mutableStateOf(existing?.startTime ?: "09:00") }
    var end by remember { mutableStateOf(existing?.endTime ?: "11:00") }
    var remind by remember { mutableStateOf(existing?.reminderTime ?: "09:00") }
    var days by remember {
        mutableStateOf(
            existing?.reminderDays
                ?.split(",")
                ?.mapNotNull { it.trim().toIntOrNull() }
                ?.toSet()
                ?: (0..6).toSet(),
        )
    }
    var color by remember { mutableStateOf(existing?.color ?: COLORS[0]) }

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
            Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("Name") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = question,
                onValueChange = { question = it },
                label = { Text("Question (optional)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Text("Session time (display only)", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = start,
                    onValueChange = { start = it },
                    label = { Text("Starts (HH:mm)") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = end,
                    onValueChange = { end = it },
                    label = { Text("Ends (HH:mm)") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
            }

            Text("Reminder", style = MaterialTheme.typography.labelLarge)
            OutlinedTextField(
                value = remind,
                onValueChange = { remind = it },
                label = { Text("Remind me at (HH:mm)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
                supportingText = { Text("Independent of start/end — pick any time") },
            )

            Text("Reminder days", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                DAY_LABELS.forEachIndexed { i, label ->
                    FilterChip(
                        selected = i in days,
                        onClick = {
                            days = if (i in days) days - i else days + i
                        },
                        label = { Text(label) },
                    )
                }
            }

            Text("Color", style = MaterialTheme.typography.labelLarge)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                COLORS.forEach { c ->
                    FilterChip(
                        selected = color == c,
                        onClick = { color = c },
                        label = { Text("●") },
                    )
                }
            }

            Spacer(Modifier.height(8.dp))
            Button(
                onClick = {
                    if (name.isBlank()) return@Button
                    onSave(
                        existing?.id,
                        name,
                        question,
                        start.ifBlank { "09:00" },
                        end,
                        remind.ifBlank { start.ifBlank { "09:00" } },
                        days.sorted().joinToString(","),
                        color,
                    )
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Save habit")
            }

            if (existing != null) {
                OutlinedButton(
                    onClick = { onDelete(existing.id) },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Delete")
                }
            }
        }
    }
}
