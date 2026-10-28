package com.onepercent.habits.nativeapp.data

import kotlinx.coroutines.flow.Flow
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class HabitRepository(
    private val habits: HabitDao,
    private val logs: LogDao,
) {
    fun observeHabits(): Flow<List<HabitEntity>> = habits.observeAll()

    fun observeLogs(dateKeys: List<String>): Flow<List<LogEntity>> =
        logs.observeForDates(dateKeys)

    suspend fun upsertHabit(habit: HabitEntity) = habits.upsert(habit)

    suspend fun deleteHabit(id: String) {
        habits.delete(id)
    }

    suspend fun setLog(log: LogEntity) = logs.upsert(log)

    suspend fun clearLog(dateKey: String, habitId: String) =
        logs.clear(dateKey, habitId)

    suspend fun getAllHabits(): List<HabitEntity> = habits.getAll()

    suspend fun exportJson(): String {
        val root = JSONObject()
        val hArr = JSONArray()
        habits.getAll().forEach { h ->
            hArr.put(
                JSONObject()
                    .put("id", h.id)
                    .put("name", h.name)
                    .put("question", h.question)
                    .put("startTime", h.startTime)
                    .put("endTime", h.endTime)
                    .put("reminderTime", h.reminderTime)
                    .put("reminderDays", h.reminderDays)
                    .put("color", h.color),
            )
        }
        val lArr = JSONArray()
        logs.getAll().forEach { l ->
            lArr.put(
                JSONObject()
                    .put("dateKey", l.dateKey)
                    .put("habitId", l.habitId)
                    .put("status", l.status)
                    .put("partialPct", l.partialPct)
                    .put("reasons", l.reasons)
                    .put("note", l.note),
            )
        }
        root.put("habits", hArr)
        root.put("logs", lArr)
        return root.toString(2)
    }

    suspend fun importJson(raw: String) {
        val root = JSONObject(raw)
        habits.clear()
        logs.clearAll()
        val hArr = root.optJSONArray("habits") ?: JSONArray()
        for (i in 0 until hArr.length()) {
            val o = hArr.getJSONObject(i)
            habits.upsert(
                HabitEntity(
                    id = o.getString("id"),
                    name = o.getString("name"),
                    question = o.optString("question", ""),
                    startTime = o.optString("startTime", o.optString("time", "09:00")),
                    endTime = o.optString("endTime", ""),
                    reminderTime = o.optString("reminderTime", o.optString("startTime", "09:00")),
                    reminderDays = o.optString("reminderDays", "0,1,2,3,4,5,6"),
                    color = o.optLong("color", 0xFF3B82F6),
                ),
            )
        }
        val lArr = root.optJSONArray("logs") ?: JSONArray()
        for (i in 0 until lArr.length()) {
            val o = lArr.getJSONObject(i)
            logs.upsert(
                LogEntity(
                    dateKey = o.getString("dateKey"),
                    habitId = o.getString("habitId"),
                    status = o.getString("status"),
                    partialPct = o.optInt("partialPct", 0),
                    reasons = o.optString("reasons", ""),
                    note = o.optString("note", ""),
                ),
            )
        }
    }

    companion object {
        private val fmt = DateTimeFormatter.ISO_LOCAL_DATE

        fun dateKey(offsetDays: Long = 0): String =
            LocalDate.now().plusDays(offsetDays).format(fmt)
    }
}
