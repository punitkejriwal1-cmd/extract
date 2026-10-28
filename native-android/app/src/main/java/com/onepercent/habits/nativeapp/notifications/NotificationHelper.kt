package com.onepercent.habits.nativeapp.notifications

import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.onepercent.habits.nativeapp.MainActivity
import com.onepercent.habits.nativeapp.R
import com.onepercent.habits.nativeapp.data.HabitEntity
import java.util.Calendar

object NotificationHelper {
    const val CHANNEL_ID = "habits_sticky"

    fun createChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                context.getString(R.string.channel_habits),
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = context.getString(R.string.channel_habits_desc)
                setShowBadge(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }
            context.getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    fun notificationId(habitId: String, dateKey: String): Int {
        var h = 0
        val s = "$habitId|$dateKey"
        for (c in s) h = 31 * h + c.code
        return h and 0x7fffffff
    }

    fun showSticky(context: Context, habit: HabitEntity, dateKey: String) {
        createChannel(context)
        val id = notificationId(habit.id, dateKey)

        val open = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("habitId", habit.id)
            putExtra("dateKey", dateKey)
        }
        val contentPi = PendingIntent.getActivity(
            context,
            id,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(habit.name)
            .setContentText(" ")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setOngoing(true) // cannot swipe away on stock Android
            .setAutoCancel(false)
            .setOnlyAlertOnce(true)
            .setContentIntent(contentPi)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()

        NotificationManagerCompat.from(context).notify(id, notification)
    }

    fun cancel(context: Context, habitId: String, dateKey: String) {
        NotificationManagerCompat.from(context)
            .cancel(notificationId(habitId, dateKey))
    }

    /** Schedule exact alarm at reminderTime for today or next matching day */
    fun schedule(context: Context, habit: HabitEntity) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val triggerAt = nextTriggerMillis(habit) ?: return

        val intent = Intent(context, ReminderReceiver::class.java).apply {
            putExtra("habitId", habit.id)
            putExtra("habitName", habit.name)
        }
        val pi = PendingIntent.getBroadcast(
            context,
            habit.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi)
        } else {
            am.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pi)
        }
    }

    fun scheduleAll(context: Context, habits: List<HabitEntity>) {
        habits.forEach { schedule(context, it) }
    }

    fun cancelSchedule(context: Context, habitId: String) {
        val am = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
        val intent = Intent(context, ReminderReceiver::class.java)
        val pi = PendingIntent.getBroadcast(
            context,
            habitId.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        am.cancel(pi)
    }

    private fun nextTriggerMillis(habit: HabitEntity): Long? {
        val parts = habit.reminderTime.split(":")
        if (parts.size < 2) return null
        val hour = parts[0].toIntOrNull() ?: return null
        val minute = parts[1].toIntOrNull() ?: return null
        val days = habit.reminderDays.split(",")
            .mapNotNull { it.trim().toIntOrNull() }
            .toSet()
            .ifEmpty { (0..6).toSet() }

        val now = Calendar.getInstance()
        val candidate = Calendar.getInstance().apply {
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
            set(Calendar.HOUR_OF_DAY, hour)
            set(Calendar.MINUTE, minute)
        }

        // Search up to 8 days ahead for next allowed weekday
        for (i in 0..7) {
            if (i > 0) candidate.add(Calendar.DAY_OF_YEAR, 1)
            val dow = candidate.get(Calendar.DAY_OF_WEEK) // 1=Sun..7=Sat
            val ourDow = (dow - 1) % 7 // 0=Sun
            if (ourDow in days && candidate.timeInMillis > now.timeInMillis + 2000) {
                return candidate.timeInMillis
            }
            if (i == 0 && ourDow !in days) {
                // keep looping
            }
        }
        return null
    }
}
