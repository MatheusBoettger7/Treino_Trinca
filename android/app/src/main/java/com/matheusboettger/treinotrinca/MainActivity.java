package com.matheusboettger.treinotrinca;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.Settings;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Window;
import android.view.View;
import android.widget.FrameLayout;
import android.graphics.Color;
import android.util.Log;

public class MainActivity extends Activity {
    private static final String TAG = "TreinoTrinca";
    private static final int NOTIFICATION_PERMISSION_REQUEST = 43;
    private static final String CHANNEL_ID = RestAlarmReceiver.CHANNEL_ID;
    private static final int REST_NOTIFICATION_ID = RestAlarmReceiver.REST_NOTIFICATION_ID;
    private boolean exactAlarmSettingsOpened = false;

    private WebView webView;
    private FrameLayout rootLayout;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        createNotificationChannel();

        rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.rgb(11, 16, 32));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(11, 16, 32));

        rootLayout.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));

        setContentView(rootLayout);
        applySystemBarInsets();

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);

        webView.addJavascriptInterface(new NotificationBridge(this), "AndroidNotifications");
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript(
                        "document.documentElement.classList.add('native-app')",
                        null
                );
            }
        });
        webView.setWebChromeClient(new WebChromeClient());

        // Cache-bust the top-level document so each native APK version loads the current web app.
        webView.loadUrl("https://matheusboettger7.github.io/Treino_Trinca/?nativeVersion=2026.09.29.55");

        requestNotificationPermission();
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(
                    new String[]{Manifest.permission.POST_NOTIFICATIONS},
                    NOTIFICATION_PERMISSION_REQUEST
            );
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Descanso do treino",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Avisos quando o descanso entre séries terminar.");
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 250, 120, 250});
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private PendingIntent getRestAlarmPendingIntent() {
        Intent intent = new Intent(this, RestAlarmReceiver.class);
        intent.setAction("com.matheusboettger.treinotrinca.REST_FINISHED");

        return PendingIntent.getBroadcast(
                this,
                REST_NOTIFICATION_ID,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private void scheduleRestNotification(int seconds) {
        cancelRestAlarmOnly();
        if (seconds <= 0) return;

        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
            if (!exactAlarmSettingsOpened) {
                exactAlarmSettingsOpened = true;
                try {
                    Intent settingsIntent = new Intent(
                            Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                            Uri.parse("package:" + getPackageName())
                    );
                    startActivity(settingsIntent);
                } catch (Exception ex) {
                    Log.w(TAG, "Não foi possível abrir as configurações de alarmes exatos.", ex);
                }
            }
        }

        PendingIntent pendingIntent = getRestAlarmPendingIntent();
        long triggerAtMillis = SystemClock.elapsedRealtime() + (seconds * 1000L);

        boolean exactScheduled = false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
                && alarmManager.canScheduleExactAlarms()) {
            try {
                alarmManager.setExactAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        triggerAtMillis,
                        pendingIntent
                );
                exactScheduled = true;
            } catch (SecurityException ex) {
                Log.w(TAG, "Não foi possível programar alarme exato; usando alarme permitido em idle.", ex);
            }
        }

        if (!exactScheduled) {
            // Fallback sem acesso especial de alarmes exatos. O Android garante que
            // setAndAllowWhileIdle não dispara antes do horário solicitado e pode
            // continuar funcionando enquanto o aparelho estiver em Doze.
            alarmManager.setAndAllowWhileIdle(
                    AlarmManager.ELAPSED_REALTIME_WAKEUP,
                    triggerAtMillis,
                    pendingIntent
            );
        }
    }

    private void cancelRestAlarmOnly() {
        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(getRestAlarmPendingIntent());
    }

    private void cancelRestNotification() {
        cancelRestAlarmOnly();
    }

    public class NotificationBridge {
        private final Context context;

        NotificationBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void scheduleRest(int seconds) {
            runOnUiThread(() -> scheduleRestNotification(seconds));
        }

        @JavascriptInterface
        public void cancelRest() {
            runOnUiThread(() -> cancelRestNotification());
        }

        @JavascriptInterface
        public void notifyRestFinished() {
            runOnUiThread(() -> {
                cancelRestAlarmOnly();
                RestAlarmReceiver.showRestNotification(context);
            });
        }
    }

    private void applySystemBarInsets() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            View.OnApplyWindowInsetsListener listener = (v, insets) -> {
                int top;
                int bottom;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    android.graphics.Insets bars = insets.getInsets(
                            android.view.WindowInsets.Type.statusBars()
                                    | android.view.WindowInsets.Type.navigationBars()
                                    | android.view.WindowInsets.Type.displayCutout()
                    );
                    top = bars.top;
                    bottom = bars.bottom;
                } else {
                    top = insets.getSystemWindowInsetTop();
                    bottom = insets.getSystemWindowInsetBottom();
                }

                FrameLayout.LayoutParams params =
                        (FrameLayout.LayoutParams) webView.getLayoutParams();
                params.topMargin = top;
                params.bottomMargin = bottom;
                webView.setLayoutParams(params);

                return insets;
            };

            rootLayout.setOnApplyWindowInsetsListener(listener);
            rootLayout.post(() -> rootLayout.requestApplyInsets());
        }
    }

    @Override
    protected void onDestroy() {
        // Do NOT cancel the rest alarm here. The whole point of the native
        // AlarmManager scheduling is to survive Activity destruction/backgrounding.
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidNotifications");
            webView.destroy();
        }
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }
}
