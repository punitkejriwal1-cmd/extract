package com.onepercent.habits.nativeapp.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.onepercent.habits.nativeapp.HabitsApp
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/** Reschedule all alarms after reboot or app update */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        val pending = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val app = context.applicationContext as HabitsApp
                val habits = app.repository.getAllHabits()
                NotificationHelper.scheduleAll(context, habits)
            } finally {
                pending.finish()
            }
        }
    }
}
