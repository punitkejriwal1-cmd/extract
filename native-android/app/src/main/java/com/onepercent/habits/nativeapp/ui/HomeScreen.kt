package com.onepercent.habits.nativeapp.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.onepercent.habits.nativeapp.data.HabitEntity
import com.onepercent.habits.nativeapp.data.LogEntity
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    vm: HabitsViewModel,
    onAdd: () -> Unit,
    onEdit: (HabitEntity) -> Unit,
    onOpenStatus: (habitId: String, dateKey: String) -> Unit,
    onSettings: () -> Unit,
    onCopyLogs: () -> Unit,
) {
    val state by vm.uiState.collectAsStateWithLifecycle()
    val dayCellSize = when (state.dateKeys.size) {
        1, 2 -> 40.dp
        3 -> 34.dp
        4 -> 30.dp
        5 -> 27.dp
        6 -> 24.dp
        else -> 22.dp
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = {
                    val done = state.habits.count { h ->
                        state.logsByKey[state.dateKeys.firstOrNull().orEmpty()]?.get(h.id)?.status == "done"
                    }
                    Text("Done: $done", fontWeight = FontWeight.ExtraBold)
                },
                actions = {
                    IconButton(onClick = onAudit) {
                        Icon(Icons.Default.ContentCopy, contentDescription = "Copy log")
                    }
                    IconButton(onClick = onSettings) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background,
                ),
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAdd) {
                Icon(Icons.Default.Add, contentDescription = "Add habit")
            }
        },
    ) { padding ->
        Column(
            Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            // Day headers
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Time", modifier = Modifier.width(56.dp), style = MaterialTheme.typography.labelSmall)
                Text("Habit", modifier = Modifier.weight(1f), style = MaterialTheme.typography.labelSmall)
                state.dateKeys.forEach { key ->
                    val d = runCatching { LocalDate.parse(key) }.getOrNull()
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        modifier = Modifier.width(dayCellSize),
                    ) {
                        Text(
                            d?.dayOfWeek?.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)?.uppercase().orEmpty(),
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.primary,
                        )
                        Text(
                            d?.dayOfMonth?.toString().orEmpty(),
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }
            }

            if (state.habits.isEmpty()) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No habits yet. Tap + to add one.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                LazyColumn {
                    itemsIndexed(state.habits, key = { _, h -> h.id }) { index, habit ->
                        HabitRow(
                            habit = habit,
                            dateKeys = state.dateKeys,
                            dayCellSize = dayCellSize,
                            logsByKey = state.logsByKey,
                            onEdit = { onEdit(habit) },
                            onCell = { dateKey -> onOpenStatus(habit.id, dateKey) },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun HabitRow(
    habit: HabitEntity,
    dateKeys: List<String>,
    dayCellSize: androidx.compose.ui.unit.Dp,
    logsByKey: Map<String, Map<String, LogEntity>>,
    onEdit: () -> Unit,
    onCell: (String) -> Unit,
) {
    val start = format12(habit.startTime)
    val end = if (habit.endTime.isNotBlank()) format12(habit.endTime) else ""
    val pill = Color(habit.color)

    Row(
        Modifier
            .fillMaxWidth()
            .clickable(onClick = onEdit)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.width(56.dp)) {
            Text(start, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            if (end.isNotEmpty()) {
                Text(end, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f))
            }
        }
        Column(Modifier.weight(1f)) {
            Box(
                Modifier
                    .clip(RoundedCornerShape(50))
                    .background(pill)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
            ) {
                Text(
                    habit.name,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(if (dateKeys.size >= 6) 2.dp else 4.dp)) {
            dateKeys.forEach { key ->
                val log = logsByKey[key]?.get(habit.id)
                StatusCell(log, dayCellSize) { onCell(key) }
            }
        }
    }
}

@Composable
private fun StatusCell(log: LogEntity?, size: androidx.compose.ui.unit.Dp, onClick: () -> Unit) {
    val bg = when (log?.status) {
        "done" -> Color(0xFF34D399)
        "partial" -> Color(0xFFFBBF24)
        "missed" -> Color(0xFFFB7185)
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    val fg = when (log?.status) {
        "done" -> Color(0xFF052E22)
        "partial" -> Color(0xFF1C1404)
        "missed" -> Color(0xFF2A0A12)
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }
    Box(
        Modifier
            .size(size)
            .clip(RoundedCornerShape(if (size < 30.dp) 7.dp else 12.dp))
            .background(bg)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        when (log?.status) {
            "done" -> Icon(Icons.Default.Check, null, tint = fg, modifier = Modifier.size(if (size < 30.dp) 13.dp else 18.dp))
            "missed" -> Icon(Icons.Default.Close, null, tint = fg, modifier = Modifier.size(if (size < 30.dp) 13.dp else 18.dp))
            "partial" -> Text("${log.partialPct.coerceAtLeast(10)}%", color = fg, fontSize = if (size < 30.dp) 8.sp else 11.sp, fontWeight = FontWeight.Bold)
            else -> Text("·", color = fg)
        }
    }
}

fun format12(time24: String): String {
    val p = time24.split(":")
    if (p.size < 2) return time24
    var h = p[0].toIntOrNull() ?: return time24
    val m = p[1]
    val ampm = if (h >= 12) "pm" else "am"
    h = h % 12
    if (h == 0) h = 12
    return "$h:$m $ampm"
}

fun durationLabel(start: String, end: String): String {
    if (end.isBlank()) return ""
    val a = start.split(":").mapNotNull { it.toIntOrNull() }
    val b = end.split(":").mapNotNull { it.toIntOrNull() }
    if (a.size < 2 || b.size < 2) return ""
    var mins = b[0] * 60 + b[1] - (a[0] * 60 + a[1])
    if (mins <= 0) mins += 24 * 60
    val h = mins / 60
    val m = mins % 60
    return when {
        h == 0 -> "$m m"
        m == 0 -> "$h h"
        else -> "$h h $m m"
    }
}
