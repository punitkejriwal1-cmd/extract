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
import java.util.UUID
import java.time.LocalDate
import java.time.format.DateTimeFormatter

data class HomeUiState(
    val habits: List<HabitEntity> = emptyList(),
    val logsByKey: Map<String, Map<String, LogEntity>> = emptyMap(),
    val dateKeys: List<String> = (0L downTo -1L).map { HabitRepository.dateKey(it) },
)

class HabitsViewModel(app: Application) : AndroidViewModel(app) {
    private val repo = (app as HabitsApp).repository
    private val ctx = app.applicationContext
    private val visibleDays = MutableStateFlow(2)

    fun setVisibleDays(days: Int) {
        visibleDays.value = days.coerceIn(1, 7)
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
        reasons: String = "",
        note: String = "",
    ) {
        viewModelScope.launch {
            repo.setLog(
                LogEntity(
                    dateKey = dateKey,
                    habitId = habitId,
                    status = status,
                    partialPct = partialPct,
                    reasons = reasons,
                    note = note,
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
        }
    }

    suspend fun exportJson(): String = repo.exportJson()

    suspend fun exportLogs(fromDate: String, toDate: String): String {
        val habits = repo.getAllHabits().sortedBy { it.startTime }
        val logs = repo.getAllLogs().associateBy { it.dateKey to it.habitId }
        val from = LocalDate.parse(fromDate)
        val to = LocalDate.parse(toDate)
        require(!from.isAfter(to)) { "Start date must not be after end date" }
        val out = StringBuilder()
        var date = from
        while (!date.isAfter(to)) {
            val key = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
            out.append("Date: ").append(date.format(DateTimeFormatter.ofPattern("EEE, dd MMM yyyy"))).append('\\n')
            habits.forEach { habit ->
                val log = logs[key to habit.id]
                out.append(habit.startTime).append(" | ").append(habit.name).append(" | ")
                when (log?.status) {
                    "done" -> out.append("DONE")
                    "partial" -> out.append("PARTIAL (").append(log.partialPct).append("%)")
                    "missed" -> out.append("MISSED")
                    else -> out.append("UNMARKED")
                }
                if (habit.question.isNotBlank()) out.append(" | Question: ").append(habit.question)
                if (!log?.reasons.isNullOrBlank()) out.append(" | Reasons: ").append(log?.reasons)
                if (!log?.note.isNullOrBlank()) out.append(" | Note: ").append(log?.note)
                out.append('\\n')
            }
            out.append('\\n')
            date = date.plusDays(1)
        }
        return out.toString().trim()
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
