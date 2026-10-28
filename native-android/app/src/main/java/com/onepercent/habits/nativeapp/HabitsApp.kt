package com.onepercent.habits.nativeapp

import android.app.Application
import com.onepercent.habits.nativeapp.data.AppDatabase
import com.onepercent.habits.nativeapp.data.HabitRepository
import com.onepercent.habits.nativeapp.notifications.NotificationHelper

class HabitsApp : Application() {
    lateinit var repository: HabitRepository
        private set

    override fun onCreate() {
        super.onCreate()
        val db = AppDatabase.get(this)
        repository = HabitRepository(db.habitDao(), db.logDao())
        NotificationHelper.createChannel(this)
    }
}
