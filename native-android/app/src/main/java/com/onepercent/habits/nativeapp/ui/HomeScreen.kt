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
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.onepercent.habits.nativeapp.data.HabitEntity
import com.onepercent.habits.nativeapp.data.LogEntity
import java.time.LocalDate
import java.time.format.TextStyle
import java.util.Locale

const val WAKE_ID = "__wake_up__"
const val SLEEP_ID = "__sleep__"

private sealed class TimelineBlock {
    data class Marker(val label: String, val time: String) : TimelineBlock()
    data class Empty(val start: Int, val end: Int) : TimelineBlock()
    data class Task(val habit: HabitEntity, val start: Int, val end: Int, val color: Color) : TimelineBlock()
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    vm: HabitsViewModel,
    wakeUpTime: String,
    sleepTime: String,
    onAdd: (startTime: String, endTime: String) -> Unit,
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
    val timeline = buildTimeline(state.habits, wakeUpTime, sleepTime)
    val todayLogs = state.logsByKey[state.dateKeys.firstOrNull().orEmpty()].orEmpty()
    val totalActivities = state.habits.size + 2
    val done = state.habits.count { h -> todayLogs[h.id]?.status == "done" } +
        listOf(WAKE_ID, SLEEP_ID).count { todayLogs[it]?.status == "done" }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("Score: $done / $totalActivities", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = onCopyLogs) { Icon(Icons.Default.ContentCopy, contentDescription = "Copy log") }
                    IconButton(onClick = onSettings) { Icon(Icons.Default.Settings, contentDescription = "Settings") }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
            )
        },
    ) { padding ->
        Column(Modifier.fillMaxSize().padding(padding)) {
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Time", modifier = Modifier.width(62.dp), style = MaterialTheme.typography.labelSmall)
                Text("Task", modifier = Modifier.weight(1f), style = MaterialTheme.typography.labelSmall)
                state.dateKeys.forEach { key ->
                    val d = runCatching { LocalDate.parse(key) }.getOrNull()
                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(dayCellSize)) {
                        Text(d?.dayOfWeek?.getDisplayName(TextStyle.SHORT, Locale.ENGLISH)?.uppercase().orEmpty(),
                            style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                        Text(d?.dayOfMonth?.toString().orEmpty(), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                    }
                }
            }

            LazyColumn(Modifier.fillMaxSize()) {
                items(timeline, key = { block -> when (block) {
                    is TimelineBlock.Marker -> "marker-${block.label}"
                    is TimelineBlock.Empty -> "empty-${block.start}-${block.end}"
                    is TimelineBlock.Task -> "task-${block.habit.id}"
                } }) { block ->
                    when (block) {
                        is TimelineBlock.Marker -> MarkerRow(
                            block.label, block.time, if (block.label == "Wake-up") WAKE_ID else SLEEP_ID,
                            state.dateKeys, dayCellSize, state.logsByKey,
                            onCell = { dateKey -> onOpenStatus(if (block.label == "Wake-up") WAKE_ID else SLEEP_ID, dateKey) },
                        )
                        is TimelineBlock.Empty -> EmptyRow(block.start, block.end, state.dateKeys.size, dayCellSize) {
                            onAdd(fromMinutes(block.start), fromMinutes(block.end))
                        }
                        is TimelineBlock.Task -> TaskRow(
                            habit = block.habit,
                            color = Color(block.habit.color),
                            dateKeys = state.dateKeys,
                            dayCellSize = dayCellSize,
                            logsByKey = state.logsByKey,
                            onEdit = { onEdit(block.habit) },
                            onCell = { dateKey -> onOpenStatus(block.habit.id, dateKey) },
                        )
                    }
                }
                item {
                    Row(Modifier.fillMaxWidth().padding(start = 12.dp, end = 12.dp, top = 2.dp, bottom = 12.dp)) {
                        Text(format12(sleepTime), modifier = Modifier.width(62.dp), fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun MarkerRow(
    label: String, time: String, id: String, dateKeys: List<String>, dayCellSize: Dp,
    logsByKey: Map<String, Map<String, LogEntity>>, onCell: (String) -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(format12(time), modifier = Modifier.width(62.dp), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Box(
            Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.surfaceVariant)
                .padding(horizontal = 10.dp, vertical = 9.dp),
        ) {
            Text(label, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
        }
        Spacer(Modifier.width(4.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(if (dateKeys.size >= 6) 2.dp else 4.dp)) {
            dateKeys.forEach { key -> StatusCell(logsByKey[key]?.get(id), dayCellSize) { onCell(key) } }
        }
    }
}

@Composable
private fun EmptyRow(start: Int, end: Int, dayCount: Int, dayCellSize: Dp, onClick: () -> Unit) {
    val duration = durationFromMinutes(end - start)
    Row(
        Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(format12(fromMinutes(start)), modifier = Modifier.width(62.dp), fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Box(Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.42f))
            .clickable(onClick = onClick).padding(horizontal = 10.dp, vertical = 7.dp)) {
            Text(duration, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        ProgressSpacer(dayCount, dayCellSize)
    }
}

@Composable
private fun ProgressSpacer(dayCount: Int, dayCellSize: Dp) {
    Row(horizontalArrangement = Arrangement.spacedBy(if (dayCount >= 6) 2.dp else 4.dp)) {
        repeat(dayCount) { Spacer(Modifier.size(dayCellSize)) }
    }
}

@Composable
private fun TaskRow(
    habit: HabitEntity,
    color: Color,
    dateKeys: List<String>,
    dayCellSize: Dp,
    logsByKey: Map<String, Map<String, LogEntity>>,
    onEdit: () -> Unit,
    onCell: (String) -> Unit,
) {
    Row(
        Modifier.fillMaxWidth().clickable(onClick = onEdit).padding(horizontal = 12.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(format12(habit.startTime), modifier = Modifier.width(62.dp), fontSize = 11.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant)
        Box(
            Modifier.weight(1f).clip(RoundedCornerShape(8.dp)).background(color).padding(horizontal = 10.dp, vertical = 10.dp),
        ) {
            Text(habit.name, color = if (color == Color(0xFFFFFF00)) Color.Black else Color.White,
                fontWeight = FontWeight.Bold, maxLines = 2, overflow = TextOverflow.Ellipsis)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(if (dateKeys.size >= 6) 2.dp else 4.dp)) {
            dateKeys.forEach { key -> StatusCell(logsByKey[key]?.get(habit.id), dayCellSize) { onCell(key) } }
        }
    }
}

@Composable
private fun StatusCell(log: LogEntity?, size: Dp, onClick: () -> Unit) {
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
    Box(Modifier.size(size).clip(RoundedCornerShape(if (size < 30.dp) 7.dp else 12.dp)).background(bg).clickable(onClick = onClick),
        contentAlignment = Alignment.Center) {
        when (log?.status) {
            "done" -> Icon(Icons.Default.Check, null, tint = fg, modifier = Modifier.size(if (size < 30.dp) 13.dp else 18.dp))
            "missed" -> Icon(Icons.Default.Close, null, tint = fg, modifier = Modifier.size(if (size < 30.dp) 13.dp else 18.dp))
            "partial" -> Text("${log.partialPct.coerceAtLeast(10)}%", color = fg, fontSize = if (size < 30.dp) 8.sp else 11.sp, fontWeight = FontWeight.Bold)
            else -> Text("·", color = fg)
        }
    }
}

private fun buildTimeline(habits: List<HabitEntity>, wake: String, sleep: String): List<TimelineBlock> {
    val requestedWake = parseMinutes(wake) ?: 300
    val requestedSleep = parseMinutes(sleep) ?: 1260
    val validSchedule = requestedSleep > requestedWake
    val start = if (validSchedule) requestedWake else 300
    val end = if (validSchedule) requestedSleep else 1260
    val sorted = habits.mapNotNull { h ->
        val a = parseMinutes(h.startTime) ?: return@mapNotNull null
        val b = parseMinutes(h.endTime) ?: return@mapNotNull null
        if (a < start || a >= end || b <= a) return@mapNotNull null
        Triple(h, a, minOf(b, end))
    }.filter { it.third > it.second }.sortedBy { it.second }

    val blocks = mutableListOf<TimelineBlock>()
    blocks += TimelineBlock.Marker("Wake-up", fromMinutes(start))
    var cursor = start
    sorted.forEach { (habit, a, b) ->
        if (a > cursor) blocks += TimelineBlock.Empty(cursor, a)
        val actualStart = maxOf(a, cursor)
        if (b > actualStart) {
            blocks += TimelineBlock.Task(habit, actualStart, b, Color(habit.color))
            cursor = b
        }
    }
    if (cursor < end) blocks += TimelineBlock.Empty(cursor, end)
    blocks += TimelineBlock.Marker("Sleep", fromMinutes(end))
    return blocks
}

private fun parseMinutes(value: String): Int? {
    val p = value.split(":")
    if (p.size != 2) return null
    val h = p[0].toIntOrNull()?.takeIf { it in 0..23 } ?: return null
    val m = p[1].toIntOrNull()?.takeIf { it in 0..59 } ?: return null
    return h * 60 + m
}

private fun fromMinutes(value: Int): String = "%02d:%02d".format((value / 60).coerceIn(0, 23), value % 60)

private fun durationFromMinutes(value: Int): String {
    val minutes = value.coerceAtLeast(0)
    val hours = minutes / 60
    val mins = minutes % 60
    return when {
        hours == 0 -> "$mins min"
        mins == 0 -> if (hours == 1) "1 h" else "$hours h"
        else -> "$hours h $mins min"
    }
}

fun format12(time24: String): String {
    val p = time24.split(":")
    if (p.size < 2) return time24
    var h = p[0].toIntOrNull() ?: return time24
    val m = p[1]
    val ampm = if (h >= 12) "pm" else "am"
    h %= 12
    if (h == 0) h = 12
    return "$h:$m $ampm"
}

fun durationLabel(start: String, end: String): String {
    val a = parseMinutes(start) ?: return ""
    val b = parseMinutes(end) ?: return ""
    var mins = b - a
    if (mins <= 0) mins += 24 * 60
    return durationFromMinutes(mins)
}
