package com.onepercent.habits.nativeapp.data

import androidx.room.withTransaction
import kotlinx.coroutines.flow.Flow
import org.json.JSONArray
import org.json.JSONObject
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class HabitRepository(private val db: AppDatabase) {
    private val habits = db.habitDao()
    private val logs = db.logDao()

    fun observeHabits(): Flow<List<HabitEntity>> = habits.observeAll()
    fun observeLogs(dateKeys: List<String>): Flow<List<LogEntity>> = logs.observeForDates(dateKeys)
    suspend fun upsertHabit(habit: HabitEntity) = habits.upsert(habit)
    suspend fun deleteHabit(id: String) = habits.delete(id)
    suspend fun setLog(log: LogEntity) = logs.upsert(log)
    suspend fun clearLog(dateKey: String, habitId: String) = logs.clear(dateKey, habitId)
    suspend fun getAllHabits(): List<HabitEntity> = habits.getAll()
    suspend fun getAllLogs(): List<LogEntity> = logs.getAll()
    suspend fun getLog(dateKey: String, habitId: String): LogEntity? = logs.getForDateAndHabit(dateKey, habitId)

    suspend fun exportJson(reasonsList: List<String> = emptyList()): String {
        val root = JSONObject()
        val hArr = JSONArray()
        habits.getAll().forEach { h ->
            val days = JSONArray()
            h.reminderDays.split(",").mapNotNull { it.trim().toIntOrNull() }.distinct().forEach(days::put)
            hArr.put(JSONObject()
                .put("id", h.id).put("name", h.name).put("question", h.question)
                .put("startTime", h.startTime).put("endTime", h.endTime)
                .put("reminderTime", h.reminderTime).put("reminderDays", days)
                .put("color", String.format("#%06X", 0xFFFFFF and h.color.toInt()))
                .put("freqType", h.freqType).put("freqDays", JSONArray(h.freqDays.split(",").mapNotNull { it.trim().toIntOrNull() }))
                .put("freqNum", h.freqNum).put("freqDates", JSONArray(h.freqDates.split(",").map { it.trim() }.filter { it.isNotEmpty() })))
        }
        val logObject = JSONObject()
        logs.getAll().forEach { l ->
            val day = logObject.optJSONObject(l.dateKey) ?: JSONObject().also { logObject.put(l.dateKey, it) }
            val item = JSONObject().put("status", l.status)
                .put("partialPct", l.partialPct)
                .put("reasons", JSONArray(l.reasons.split(",").map { it.trim() }.filter { it.isNotEmpty() }))
                .put("note", l.note)
            day.put(l.habitId, item)
        }
        root.put("habits", hArr).put("logs", logObject).put("reasonsList", JSONArray(reasonsList))
        return root.toString(2)
    }

    /**
     * Accepts both the native backup format (logs array, reminderDays CSV) and
     * the web backup format (logs object keyed by date/habit, reminderDays array).
     * All parsing/validation happens before the database transaction starts.
     */
    suspend fun importJson(raw: String) {
        val root = JSONObject(raw)
        val hArr = root.optJSONArray("habits")
            ?: throw IllegalArgumentException("Backup does not contain a habits array")
        val parsedHabits = mutableListOf<HabitEntity>()
        val ids = mutableSetOf<String>()
        for (i in 0 until hArr.length()) {
            val o = hArr.optJSONObject(i) ?: throw IllegalArgumentException("Invalid habit entry")
            val id = o.optString("id").trim()
            val name = o.optString("name").trim()
            if (id.isEmpty() || name.isEmpty() || !ids.add(id)) {
                throw IllegalArgumentException("Habit IDs and names must be present and unique")
            }
            val daysValue = o.opt("reminderDays")
            val days = when (daysValue) {
                is JSONArray -> (0 until daysValue.length()).mapNotNull { daysValue.optInt(it, -1).takeIf { d -> d in 0..6 } }.distinct()
                is String -> daysValue.split(",").mapNotNull { it.trim().toIntOrNull()?.takeIf { d -> d in 0..6 } }.distinct()
                else -> (0..6).toList()
            }
            val rawColor = o.opt("color")
            val color = when (rawColor) {
                is Number -> rawColor.toLong()
                is String -> runCatching { android.graphics.Color.parseColor(rawColor).toLong() }.getOrDefault(0xFF3B82F6)
                else -> 0xFF3B82F6
            }
            val start = o.optString("startTime", o.optString("time", "09:00")).ifBlank { "09:00" }
            val remind = o.optString("reminderTime", start).ifBlank { start }
            parsedHabits += HabitEntity(
                id = id, name = name, question = o.optString("question", ""),
                startTime = start, endTime = o.optString("endTime", ""),
                reminderTime = remind, reminderDays = days.joinToString(","),
                color = color, sortKey = start,
                freqType = o.optString("freqType", "daily"),
                freqDays = when (val fd = o.opt("freqDays")) {
                    is JSONArray -> (0 until fd.length()).mapNotNull { fd.optInt(it, -1).takeIf { d -> d in 0..6 } }.distinct().joinToString(",")
                    is String -> fd
                    else -> "0,1,2,3,4,5,6"
                },
                freqNum = o.optInt("freqNum", 2).coerceIn(1, 31),
                freqDates = when (val fds = o.opt("freqDates")) {
                    is JSONArray -> (0 until fds.length()).mapNotNull { fds.optString(it).takeIf(String::isNotBlank) }.joinToString(",")
                    is String -> fds
                    else -> ""
                },
            )
        }

        val parsedLogs = mutableListOf<LogEntity>()
        val rawLogs = root.opt("logs")
        when (rawLogs) {
            is JSONArray -> {
                for (i in 0 until rawLogs.length()) {
                    val o = rawLogs.optJSONObject(i) ?: throw IllegalArgumentException("Invalid log entry")
                    val date = o.optString("dateKey")
                    val habitId = o.optString("habitId")
                    if (date.isBlank() || habitId.isBlank() || habitId !in ids) continue
                    parsedLogs += LogEntity(date, habitId, o.optString("status", "missed"),
                        o.optInt("partialPct", 0), normalizeReasons(o.opt("reasons")), o.optString("note", ""))
                }
            }
            is JSONObject -> {
                val dateKeys = rawLogs.keys()
                while (dateKeys.hasNext()) {
                    val date = dateKeys.next()
                    val day = rawLogs.optJSONObject(date) ?: continue
                    val habitKeys = day.keys()
                    while (habitKeys.hasNext()) {
                        val habitId = habitKeys.next()
                        if (habitId !in ids) continue
                        val o = day.optJSONObject(habitId) ?: continue
                        parsedLogs += LogEntity(date, habitId, o.optString("status", "missed"),
                            o.optInt("partialPct", 0), normalizeReasons(o.opt("reasons")), o.optString("note", ""))
                    }
                }
            }
            null -> Unit
            else -> throw IllegalArgumentException("Invalid logs section")
        }

        db.withTransaction {
            habits.clear()
            logs.clearAll()
            parsedHabits.forEach { habits.upsert(it) }
            parsedLogs.forEach { logs.upsert(it) }
        }
    }

    private fun normalizeReasons(value: Any?): String = when (value) {
        is JSONArray -> (0 until value.length()).mapNotNull { value.optString(it).takeIf(String::isNotBlank) }.joinToString(",")
        is String -> value
        else -> ""
    }

    companion object {
        private val fmt = DateTimeFormatter.ISO_LOCAL_DATE
        fun dateKey(offsetDays: Long = 0): String = LocalDate.now().plusDays(offsetDays).format(fmt)
    }
}
