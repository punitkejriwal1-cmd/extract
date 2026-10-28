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
                Button(
                    onClick = {
                        vm.mark(
                            habitId,
                            dateKey,
                            status!!,
                            partialPct = if (status == "partial") pct.toInt() else 0,
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
