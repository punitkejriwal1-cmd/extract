package com.onepercent.habits.nativeapp.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
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
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuditScreen(vm: HabitsViewModel, onClose: () -> Unit) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val today = LocalDate.now()
    var mode by remember { mutableStateOf("today") }
    var from by remember { mutableStateOf(today.format(DateTimeFormatter.ISO_LOCAL_DATE)) }
    var to by remember { mutableStateOf(today.format(DateTimeFormatter.ISO_LOCAL_DATE)) }
    var preview by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    fun range(): Pair<String, String> = when (mode) {
        "yesterday" -> { val d = today.minusDays(1).toString(); d to d }
        "dates" -> from to to
        else -> today.toString() to today.toString()
    }

    Scaffold(topBar = {
        TopAppBar(title = { Text("Copy log") }, navigationIcon = {
            IconButton(onClick = onClose) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
        })
    }) { padding ->
        Column(Modifier.padding(padding).verticalScroll(rememberScrollState()).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                FilterChip(selected = mode == "today", onClick = { mode = "today" }, label = { Text("Today") })
                FilterChip(selected = mode == "yesterday", onClick = { mode = "yesterday" }, label = { Text("Yesterday") })
                FilterChip(selected = mode == "dates", onClick = { mode = "dates" }, label = { Text("Dates") })
            }
            if (mode == "dates") {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(value = from, onValueChange = { from = it }, label = { Text("From (YYYY-MM-DD)") }, singleLine = true, modifier = Modifier.weight(1f))
                    OutlinedTextField(value = to, onValueChange = { to = it }, label = { Text("To (YYYY-MM-DD)") }, singleLine = true, modifier = Modifier.weight(1f))
                }
                Text("Enter dates in YYYY-MM-DD format.", style = MaterialTheme.typography.bodySmall)
            }
            Button(onClick = {
                scope.launch {
                    try {
                        val (start, end) = range()
                        LocalDate.parse(start); LocalDate.parse(end)
                        preview = vm.buildAuditText(mode, start, end)
                        val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                        clipboard.setPrimaryClip(ClipData.newPlainText("Habit logs", preview))
                        message = "Logs copied to clipboard."
                    } catch (_: Exception) {
                        message = "Could not copy logs. Check the date format and make sure From is not after To."
                    }
                }
            }, modifier = Modifier.fillMaxWidth()) { Text("Copy logs") }
            if (message.isNotBlank()) Text(message, color = MaterialTheme.colorScheme.primary)
            if (preview.isNotBlank()) OutlinedTextField(value = preview, onValueChange = {}, readOnly = true, label = { Text("Preview") }, modifier = Modifier.fillMaxWidth(), minLines = 8)
        }
    }
}
