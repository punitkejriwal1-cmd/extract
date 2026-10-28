package com.onepercent.habits.nativeapp.data

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [HabitEntity::class, LogEntity::class],
    version = 2,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun habitDao(): HabitDao
    abstract fun logDao(): LogDao

    companion object {
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE habits ADD COLUMN freqType TEXT NOT NULL DEFAULT 'daily'")
                db.execSQL("ALTER TABLE habits ADD COLUMN freqDays TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6'")
                db.execSQL("ALTER TABLE habits ADD COLUMN freqNum INTEGER NOT NULL DEFAULT 2")
                db.execSQL("ALTER TABLE habits ADD COLUMN freqDates TEXT NOT NULL DEFAULT ''")
            }
        }

        @Volatile private var instance: AppDatabase? = null

        fun get(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "one_percent_habits.db",
                ).addMigrations(MIGRATION_1_2).build().also { instance = it }
            }
    }
}
