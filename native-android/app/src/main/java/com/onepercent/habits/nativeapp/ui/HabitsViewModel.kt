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
            NotificationHelper.scheduleAll(ctx, repo.getAllHabits())
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

    suspend fun exportJson(): String = repo.exportJson()

    suspend fun buildAuditText(mode: String, from: String, to: String): String {
        val habits = repo.getAllHabits().sortedBy { it.startTime }
        val logs = repo.getAllLogs().associateBy { it.dateKey to it.habitId }
        val today = LocalDate.now()
        val start: LocalDate
        val end: LocalDate
        when (mode) {
            "today" -> { start = today; end = today }
            "yesterday" -> { start = today.minusDays(1); end = start }
            else -> {
                val a = runCatching { LocalDate.parse(from) }.getOrDefault(today.minusDays(6))
                val b = runCatching { LocalDate.parse(to) }.getOrDefault(today)
                start = minOf(a, b)
                end = minOf(maxOf(a, b), today)
            }
        }
        val lines = mutableListOf<String>()
        var date = start
        var count = 0
        while (!date.isAfter(end) && count < 62) {
            val key = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
            lines += "Date: ${date.format(DateTimeFormatter.ofPattern("EEE, dd MMM yyyy"))}"
            habits.forEach { habit ->
                val log = logs[key to habit.id]
                val time = format12(habit.startTime)
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
                lines += "$time | ${habit.name} | $detail$question"
            }
            lines += ""
            date = date.plusDays(1)
            count++
        }
        return lines.joinToString("\n").trim()
    }

    fun importJson(raw: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val previousHabits = repo.getAllHabits()
                repo.importJson(raw)
                previousHabits.forEach { NotificationHelper.cancelSchedule(ctx, it.id) }
                NotificationHelper.scheduleAll(ctx, repo.getAllHabits())
                onDone(true)
            } catch (_: Exception) {
                onDone(false)
            }
        }
    }
}
