package com.matheusboettger.treinotrinca;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

public class RestAlarmReceiver extends BroadcastReceiver {
    static final String CHANNEL_ID = "treino_trinca_rest";
    static final int REST_NOTIFICATION_ID = 4301;

    @Override
    public void onReceive(Context context, Intent intent) {
        showRestNotification(context);
    }

    static void showRestNotification(Context context) {
        NotificationManager manager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Descanso do treino",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Avisos quando o descanso entre séries terminar.");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 120, 250});
            manager.createNotificationChannel(channel);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS)
                != android.content.pm.PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Intent openApp = new Intent(context, MainActivity.class);
        openApp.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                REST_NOTIFICATION_ID,
                openApp,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        android.app.Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new android.app.Notification.Builder(context, CHANNEL_ID);
        } else {
            builder = new android.app.Notification.Builder(context);
        }

        builder.setSmallIcon(com.matheusboettger.treinotrinca.R.drawable.ic_launcher)
                .setContentTitle("Descanso concluído! ⏱️")
                .setContentText("Hora de voltar para a próxima série. 💪")
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(android.app.Notification.PRIORITY_HIGH)
                .setVibrate(new long[]{0, 250, 120, 250});

        manager.notify(REST_NOTIFICATION_ID, builder.build());
    }
}