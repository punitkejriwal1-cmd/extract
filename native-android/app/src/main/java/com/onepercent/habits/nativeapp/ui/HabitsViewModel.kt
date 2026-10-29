package com.onepercent.habits.nativeapp.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.onepercent.habits.nativeapp.HabitsApp
import com.onepercent.habits.nativeapp.data.HabitEntity
import com.onepercent.habits.nativeapp.data.HabitRepository
import com.onepercent.habits.nativeapp.data.LogEntity
import com.onepercent.habits.nativeapp.notifications.NotificationHelper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID
import org.json.JSONArray
import org.json.JSONObject

data class HomeUiState(
    val habits: List<HabitEntity> = emptyList(),
    val logsByKey: Map<String, Map<String, LogEntity>> = emptyMap(),
    val dateKeys: List<String> = (0L downTo -1L).map { HabitRepository.dateKey(it) },
)

class HabitsViewModel(app: Application) : AndroidViewModel(app) {
    private val repo = (app as HabitsApp).repository
    private val ctx = app.applicationContext
    private val prefs = ctx.getSharedPreferences("habit_reasons", android.content.Context.MODE_PRIVATE)
    private val defaultReasons = listOf(
        "Overslept", "Previous Task Overran", "Phone Distraction",
        "Low Energy / Tired", "Procrastinated", "Urgent Work",
    )
    private val _reasons = MutableStateFlow(
        prefs.getStringSet("reasons", null)?.toList()?.sorted()
            ?: defaultReasons,
    )
    val reasons = _reasons
    private val visibleDays = MutableStateFlow(2)

    fun setVisibleDays(days: Int) {
        visibleDays.value = days.coerceIn(1, 7)
    }

    fun addReason(reason: String) {
        val value = reason.trim().take(40)
        if (value.isBlank()) return
        val next = (_reasons.value + value).distinct()
        _reasons.value = next
        prefs.edit().putStringSet("reasons", next.toSet()).apply()
    }

    fun removeReason(reason: String) {
        val next = _reasons.value.filterNot { it == reason }
        _reasons.value = next
        prefs.edit().putStringSet("reasons", next.toSet()).apply()
    }

    val uiState = combine(
        repo.observeHabits(),
        visibleDays.flatMapLatest { count ->
            val keys = (0 until count).map { HabitRepository.dateKey(-it.toLong()) }
            repo.observeLogs(keys).map { logs -> keys to logs }
        },
    ) { habits, datedLogs ->
        val (keys, logs) = datedLogs
        val map = mutableMapOf<String, MutableMap<String, LogEntity>>()
        logs.forEach { log ->
            map.getOrPut(log.dateKey) { mutableMapOf() }[log.habitId] = log
        }
        HomeUiState(habits = habits, logsByKey = map, dateKeys = keys)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), HomeUiState())

    fun refreshAlarms() {
        viewModelScope.launch {
            val today = HabitRepository.dateKey(0)
            val completed = repo.getAllLogs().filter { it.dateKey == today }.map { it.habitId }.toSet()
            NotificationHelper.scheduleAll(ctx, repo.getAllHabits(), completed)
        }
    }

    fun saveHabit(
        id: String?,
        name: String,
        question: String,
        startTime: String,
        endTime: String,
        reminderTime: String,
        reminderDays: String,
        freqType: String,
        freqDays: String,
        freqNum: Int,
        freqDates: String,
        color: Long,
    ) {
        viewModelScope.launch {
            val entity = HabitEntity(
                id = id ?: UUID.randomUUID().toString(),
                name = name.trim(),
                question = question.trim(),
                startTime = startTime,
                endTime = endTime,
                reminderTime = reminderTime,
                reminderDays = reminderDays,
                color = color,
                sortKey = startTime,
                freqType = freqType,
                freqDays = freqDays,
                freqNum = freqNum.coerceIn(1, 31),
                freqDates = freqDates,
            )
            repo.upsertHabit(entity)
            NotificationHelper.cancel(ctx, entity.id, HabitRepository.dateKey(0))
            NotificationHelper.schedule(ctx, entity)
        }
    }

    fun deleteHabit(id: String) {
        viewModelScope.launch {
            NotificationHelper.cancelSchedule(ctx, id)
            NotificationHelper.cancel(ctx, id, HabitRepository.dateKey(0))
            repo.deleteHabit(id)
        }
    }

    fun mark(
        habitId: String,
        dateKey: String,
        status: String,
        partialPct: Int = 0,
        reasons: List<String> = emptyList(),
        note: String = "",
    ) {
        viewModelScope.launch {
            repo.setLog(
                LogEntity(
                    dateKey = dateKey,
                    habitId = habitId,
                    status = status,
                    partialPct = partialPct,
                    reasons = reasons.joinToString(", "),
                    note = note.trim(),
                ),
            )
            if (dateKey == HabitRepository.dateKey(0)) {
                NotificationHelper.cancel(ctx, habitId, dateKey)
            }
        }
    }

    fun clearMark(habitId: String, dateKey: String) {
        viewModelScope.launch {
            repo.clearLog(dateKey, habitId)
            if (dateKey == HabitRepository.dateKey(0)) {
                repo.getAllHabits().find { it.id == habitId }?.let { NotificationHelper.schedule(ctx, it) }
            }
        }
    }

    suspend fun exportJson(): String {
        val root = JSONObject(repo.exportJson())
        root.put("reasonsList", JSONArray(_reasons.value))
        return root.toString(2)
    }

    suspend fun buildAuditText(mode: String, from: String, to: String): String {
        val settings = ctx.getSharedPreferences("app_settings", android.content.Context.MODE_PRIVATE)
        val wake = settings.getString("wake_up_time", "05:00") ?: "05:00"
        val sleep = settings.getString("sleep_time", "21:00") ?: "21:00"
        val wakeMinute = parseMinutes(wake) ?: 300
        val sleepMinute = parseMinutes(sleep)?.takeIf { it > wakeMinute } ?: 1260
        val habits = repo.getAllHabits().sortedBy { it.startTime }
        val logs = repo.getAllLogs().associateBy { it.dateKey to it.habitId }
        val today = LocalDate.now()
        val startDate: LocalDate
        val endDate: LocalDate
        when (mode) {
            "today" -> { startDate = today; endDate = today }
            "yesterday" -> { startDate = today.minusDays(1); endDate = startDate }
            else -> {
                val a = runCatching { LocalDate.parse(from) }.getOrDefault(today.minusDays(6))
                val b = runCatching { LocalDate.parse(to) }.getOrDefault(today)
                startDate = minOf(a, b)
                endDate = minOf(maxOf(a, b), today)
            }
        }
        val lines = mutableListOf<String>()
        var date = startDate
        var count = 0
        while (!date.isAfter(endDate) && count < 62) {
            val key = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
            lines += "Date: ${date.format(DateTimeFormatter.ofPattern("EEE, dd MMM yyyy"))}"
            lines += "${format12(wake)} | Wake-up"
            var cursor = wakeMinute
            val scheduled = habits.mapNotNull { habit ->
                val a = parseMinutes(habit.startTime) ?: return@mapNotNull null
                val b = parseMinutes(habit.endTime) ?: return@mapNotNull null
                if (a < wakeMinute || a >= sleepMinute || b <= a) return@mapNotNull null
                Triple(habit, a, minOf(b, sleepMinute)).takeIf { it.third > it.second }
            }
            scheduled.forEach { (habit, a, b) ->
                if (a > cursor) {
                    val duration = durationFromMinutes(a - cursor)
                    lines += "${format12(fromMinutes(cursor))} | EMPTY | $duration"
                }
                val actualStart = maxOf(a, cursor)
                if (b <= actualStart) return@forEach
                val log = logs[key to habit.id]
                val question = habit.question.trim().takeIf { it.isNotEmpty() }?.let { " | Question: $it" }.orEmpty()
                val detail = when (log?.status) {
                    "done" -> "DONE"
                    "partial" -> "PARTIAL (${log.partialPct.coerceAtLeast(10)}%)" +
                        (log.reasons.takeIf { it.isNotBlank() }?.let { " | Reasons: $it" } ?: "") +
                        (log.note.takeIf { it.isNotBlank() }?.let { " | Note: $it" } ?: "")
                    "missed" -> "MISSED" +
                        (log.reasons.takeIf { it.isNotBlank() }?.let { " | Reasons: $it" } ?: "") +
                        (log.note.takeIf { it.isNotBlank() }?.let { " | Note: $it" } ?: "")
                    else -> "UNMARKED"
                }
                lines += "${format12(fromMinutes(actualStart))} | ${habit.name} | $detail$question"
                cursor = b
            }
            if (cursor < sleepMinute) {
                val duration = durationFromMinutes(sleepMinute - cursor)
                lines += "${format12(fromMinutes(cursor))} | EMPTY | $duration"
            }
            lines += "${format12(fromMinutes(sleepMinute))} | Sleep"
            lines += ""
            date = date.plusDays(1)
            count++
        }
        return lines.joinToString("\n").trim()
    }

    private fun parseMinutes(value: String): Int? {
        val parts = value.split(":")
        if (parts.size != 2) return null
        val hour = parts[0].toIntOrNull()?.takeIf { it in 0..23 } ?: return null
        val minute = parts[1].toIntOrNull()?.takeIf { it in 0..59 } ?: return null
        return hour * 60 + minute
    }

    private fun fromMinutes(value: Int): String =
        "%02d:%02d".format((value / 60).coerceIn(0, 23), value % 60)

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

    fun importJson(raw: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val previousHabits = repo.getAllHabits()
                repo.importJson(raw)
                val savedReasons = runCatching {
                    val arr = JSONObject(raw).optJSONArray("reasonsList")
                    if (arr == null) null else (0 until arr.length()).mapNotNull { arr.optString(it).trim().takeIf(String::isNotBlank) }
                }.getOrNull()
                if (savedReasons != null) {
                    _reasons.value = savedReasons.distinct()
                    prefs.edit().putStringSet("reasons", _reasons.value.toSet()).apply()
                }
                previousHabits.forEach { NotificationHelper.cancelSchedule(ctx, it.id) }
                NotificationHelper.scheduleAll(ctx, repo.getAllHabits(), repo.getAllLogs().filter { it.dateKey == HabitRepository.dateKey(0) }.map { it.habitId }.toSet())
                onDone(true)
            } catch (_: Exception) {
                onDone(false)
            }
        }
    }
}
