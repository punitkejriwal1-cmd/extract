package com.onepercent.habits.nativeapp.ui

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.onepercent.habits.nativeapp.HabitsApp
import com.onepercent.habits.nativeapp.data.HabitEntity
import com.onepercent.habits.nativeapp.data.HabitRepository
import com.onepercent.habits.nativeapp.data.LogEntity
import com.onepercent.habits.nativeapp.notifications.NotificationHelper
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.UUID

data class HomeUiState(
    val habits: List<HabitEntity> = emptyList(),
    val logsByKey: Map<String, Map<String, LogEntity>> = emptyMap(),
    val dateKeys: List<String> = listOf(HabitRepository.dateKey(0), HabitRepository.dateKey(-1)),
)

class HabitsViewModel(app: Application) : AndroidViewModel(app) {
    private val repo = (app as HabitsApp).repository
    private val ctx = app.applicationContext

    private val dateKeys = listOf(
        HabitRepository.dateKey(0),
        HabitRepository.dateKey(-1),
    )

    val uiState = combine(
        repo.observeHabits(),
        repo.observeLogs(dateKeys),
    ) { habits, logs ->
        val map = mutableMapOf<String, MutableMap<String, LogEntity>>()
        logs.forEach { log ->
            map.getOrPut(log.dateKey) { mutableMapOf() }[log.habitId] = log
        }
        HomeUiState(habits = habits, logsByKey = map, dateKeys = dateKeys)
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

    fun importJson(raw: String, onDone: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                repo.importJson(raw)
                NotificationHelper.scheduleAll(ctx, repo.getAllHabits())
                onDone(true)
            } catch (_: Exception) {
                onDone(false)
            }
        }
    }
}
