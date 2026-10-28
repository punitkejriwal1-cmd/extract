package com.onepercent.habits.nativeapp.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface HabitDao {
    @Query("SELECT * FROM habits ORDER BY startTime ASC")
    fun observeAll(): Flow<List<HabitEntity>>

    @Query("SELECT * FROM habits ORDER BY startTime ASC")
    suspend fun getAll(): List<HabitEntity>

    @Query("SELECT * FROM habits WHERE id = :id LIMIT 1")
    suspend fun getById(id: String): HabitEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(habit: HabitEntity)

    @Query("DELETE FROM habits WHERE id = :id")
    suspend fun delete(id: String)

    @Query("DELETE FROM habits")
    suspend fun clear()
}

@Dao
interface LogDao {
    @Query("SELECT * FROM logs WHERE dateKey = :dateKey")
    fun observeForDate(dateKey: String): Flow<List<LogEntity>>

    @Query("SELECT * FROM logs WHERE dateKey IN (:keys)")
    fun observeForDates(keys: List<String>): Flow<List<LogEntity>>

    @Query("SELECT * FROM logs")
    suspend fun getAll(): List<LogEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(log: LogEntity)

    @Query("DELETE FROM logs WHERE dateKey = :dateKey AND habitId = :habitId")
    suspend fun clear(dateKey: String, habitId: String)

    @Query("DELETE FROM logs")
    suspend fun clearAll()
}
