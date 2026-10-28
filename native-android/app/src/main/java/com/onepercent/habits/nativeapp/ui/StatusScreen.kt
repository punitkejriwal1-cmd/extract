package com.onepercent.habits.nativeapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatusScreen(
    habitId: String,
    dateKey: String,
    vm: HabitsViewModel,
    onClose: () -> Unit,
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val habit = state.habits.find { it.id == habitId }
    val existing = state.logsByKey[dateKey]?.get(habitId)

    var status by remember { mutableStateOf(existing?.status) }
    var pct by remember { mutableFloatStateOf((existing?.partialPct ?: 50).toFloat()) }
    var reasonsText by remember { mutableStateOf(existing?.reasons.orEmpty()) }
    var note by remember { mutableStateOf(existing?.note.orEmpty()) }
    var customReason by remember { mutableStateOf("") }
    val commonReasons = listOf("Overslept", "Previous Task Overran", "Phone Distraction", "Low Energy / Tired", "Procrastinated", "Urgent Work")
    val selectedReasons = reasonsText.split(",").map { it.trim() }.filter { it.isNotEmpty() }.toSet()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(habit?.name ?: "Habit") },
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
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(dateKey)
            if (!habit?.question.isNullOrBlank()) {
                Text(habit!!.question)
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(
                    selected = status == "done",
                    onClick = {
                        status = "done"
                        vm.mark(habitId, dateKey, "done")
                        onClose()
                    },
                    label = { Text("Done") },
                )
                FilterChip(
                    selected = status == "partial",
                    onClick = { status = "partial" },
                    label = { Text("Partial") },
                )
                FilterChip(
                    selected = status == "missed",
                    onClick = { status = "missed" },
                    label = { Text("Missed") },
                )
            }

            if (status == "partial") {
                Text("Completion ${pct.toInt()}%")
                Slider(
                    value = pct,
                    onValueChange = { pct = it },
                    valueRange = 10f..90f,
                    steps = 7,
                )
            }

            if (status == "partial" || status == "missed") {
                Text("Reason for not completing", style = MaterialTheme.typography.titleSmall)
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    commonReasons.forEach { reason ->
                        FilterChip(
                            selected = reason in selectedReasons,
                            onClick = {
                                val next = if (reason in selectedReasons) selectedReasons - reason else selectedReasons + reason
                                reasonsText = next.joinToString(", ")
                            },
                            label = { Text(reason) },
                        )
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = customReason, onValueChange = { customReason = it }, label = { Text("Other reason") }, singleLine = true, modifier = Modifier.weight(1f))
                    Button(onClick = {
                        val value = customReason.trim()
                        if (value.isNotEmpty()) { reasonsText = (selectedReasons + value).joinToString(", "); customReason = "" }
                    }) { Text("Add") }
                }
                OutlinedTextField(value = note, onValueChange = { note = it }, label = { Text("Note (optional)") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
                Button(
                    onClick = {
                        vm.mark(
                            habitId,
                            dateKey,
                            status!!,
                            partialPct = if (status == "partial") pct.toInt() else 0,
                            reasons = reasonsText,
                            note = note,
                        )
                        onClose()
                    },
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Save")
                }
            }

            OutlinedButton(
                onClick = {
                    vm.clearMark(habitId, dateKey)
                    onClose()
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Clear")
            }
        }
    }
}
