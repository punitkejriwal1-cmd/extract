package com.onepercent.habits.nativeapp.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.onepercent.habits.nativeapp.HabitsApp
import com.onepercent.habits.nativeapp.data.HabitRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val habitId = intent.getStringExtra("habitId") ?: return
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val app = context.applicationContext as HabitsApp
                val habit = app.repository.getAllHabits().find { it.id == habitId } ?: return@launch
                val today = HabitRepository.dateKey(0)
                // Never show a reminder for a habit already marked today.
                if (app.repository.getLog(today, habitId) == null) {
                    NotificationHelper.showSticky(context, habit, today)
                } else {
                    NotificationHelper.cancel(context, habitId, today)
                }
                // AlarmManager alarms are one-shot: always arm the next selected weekday.
                NotificationHelper.schedule(context, habit)
            } finally {
                pending.finish()
            }
        }
    }
}
