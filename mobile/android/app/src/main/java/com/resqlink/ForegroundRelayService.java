package com.resqlink;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

public class ForegroundRelayService extends Service {
  public static final String CHANNEL_ID = "resqlink_foreground";

  @Override
  public void onCreate() {
    super.onCreate();
    createNotificationChannel();
    Notification notification =
        new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("ResQLink relay active")
            .setContentText("Keeping Bluetooth and location relay alive")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .build();
    startForeground(1, notification);
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    return START_STICKY;
  }

  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  private void createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationChannel channel =
          new NotificationChannel(CHANNEL_ID, "Relay Service", NotificationManager.IMPORTANCE_LOW);
      NotificationManager manager = getSystemService(NotificationManager.class);
      if (manager != null) {
        manager.createNotificationChannel(channel);
      }
    }
  }
}
