package com.onepercent.habits.nativeapp.data

import androidx.room.Entity
import androidx.room.ColumnInfo
import androidx.room.PrimaryKey

@Entity(tableName = "habits")
data class HabitEntity(
    @PrimaryKey val id: String,
    val name: String,
    val question: String = "",
    val startTime: String,      // "09:00"
    val endTime: String = "",    // "11:00"
    val reminderTime: String,   // when notification fires
    val reminderDays: String = "0,1,2,3,4,5,6", // CSV of day ints
    val color: Long = 0xFF3B82F6,
    val sortKey: String = startTime,
    @ColumnInfo(defaultValue = "'daily'") val freqType: String = "daily",
    @ColumnInfo(defaultValue = "'0,1,2,3,4,5,6'") val freqDays: String = "0,1,2,3,4,5,6",
    @ColumnInfo(defaultValue = "2") val freqNum: Int = 2,
    @ColumnInfo(defaultValue = "''") val freqDates: String = "",
)

@Entity(tableName = "logs", primaryKeys = ["dateKey", "habitId"])
data class LogEntity(
    val dateKey: String, // yyyy-MM-dd
    val habitId: String,
    val status: String, // done | partial | missed
    val partialPct: Int = 0,
    val reasons: String = "",
    val note: String = "",
)

enum class HabitStatus { DONE, PARTIAL, MISSED }
