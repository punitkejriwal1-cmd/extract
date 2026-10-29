package com.onepercent.habits.nativeapp.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
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
fun StatusScreen(habitId: String, dateKey: String, vm: HabitsViewModel, onClose: () -> Unit) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val availableReasons by vm.reasons.collectAsState()
    val habit = state.habits.find { it.id == habitId }
    val existing = state.logsByKey[dateKey]?.get(habitId)

    var status by remember(habitId, dateKey, existing?.status) { mutableStateOf(existing?.status) }
    var pct by remember(habitId, dateKey, existing?.partialPct) { mutableFloatStateOf((existing?.partialPct ?: 50).toFloat()) }
    var reasons by remember(habitId, dateKey, existing?.reasons) {
        mutableStateOf(existing?.reasons?.split(",")?.map { it.trim() }?.filter { it.isNotBlank() } ?: emptyList())
    }
    var note by remember(habitId, dateKey, existing?.note) { mutableStateOf(existing?.note.orEmpty()) }
    var reasonInput by remember(habitId, dateKey) { mutableStateOf("") }

    Scaffold(topBar = {
        TopAppBar(title = { Text(habit?.name ?: "Habit") }, navigationIcon = {
            IconButton(onClick = onClose) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
        })
    }) { padding ->
        Column(
            Modifier.fillMaxSize().padding(padding).imePadding().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(dateKey)
            if (!habit?.question.isNullOrBlank()) Text(habit!!.question)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(selected = status == "done", onClick = {
                    status = "done"
                    vm.mark(habitId, dateKey, "done")
                    onClose()
                }, label = { Text("Done") })
                FilterChip(selected = status == "partial", onClick = { status = "partial" }, label = { Text("Partial") })
                FilterChip(selected = status == "missed", onClick = { status = "missed" }, label = { Text("Missed") })
            }
            if (status == "partial") {
                Text("Completion: ${pct.toInt()}%")
                Slider(value = pct, onValueChange = { pct = it }, valueRange = 10f..90f, steps = 7)
            }
            if (status == "partial" || status == "missed") {
                Text("Reason for not completing", style = MaterialTheme.typography.titleMedium)
                availableReasons.forEach { reason ->
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        FilterChip(selected = reason in reasons, onClick = {
                            reasons = if (reason in reasons) reasons - reason else reasons + reason
                        }, label = { Text(reason) })
                        IconButton(onClick = {
                            vm.removeReason(reason)
                            reasons = reasons - reason
                        }) { Icon(Icons.Default.Close, contentDescription = "Remove $reason") }
                    }
                }
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(value = reasonInput, onValueChange = { reasonInput = it.take(40) },
                        label = { Text("Add a reason") }, singleLine = true, modifier = Modifier.weight(1f))
                    Button(onClick = {
                        val value = reasonInput.trim()
                        if (value.isNotEmpty()) {
                            vm.addReason(value)
                            if (value !in reasons) reasons = reasons + value
                            reasonInput = ""
                        }
                    }) { Text("Add") }
                }
                OutlinedTextField(value = note, onValueChange = { note = it },
                    label = { Text("Additional note (optional)") }, modifier = Modifier.fillMaxWidth(), minLines = 2)
                Button(onClick = {
                    vm.mark(habitId, dateKey, status!!,
                        partialPct = if (status == "partial") pct.toInt() else 0,
                        reasons = reasons, note = note)
                    onClose()
                }, modifier = Modifier.fillMaxWidth()) { Text("Save") }
            }
            OutlinedButton(onClick = { vm.clearMark(habitId, dateKey); onClose() }, modifier = Modifier.fillMaxWidth()) { Text("Clear") }
        }
    }
}
