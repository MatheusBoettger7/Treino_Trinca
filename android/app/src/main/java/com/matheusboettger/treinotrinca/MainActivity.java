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
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import android.graphics.Color;
import android.util.Log;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String TAG = "TreinoTrinca";
    private static final int NOTIFICATION_PERMISSION_REQUEST = 43;
    private static final int BACKUP_FILE_CHOOSER_REQUEST = 1001;
    private static final int BACKUP_CREATE_DOCUMENT_REQUEST = 1002;
    private static final String CHANNEL_ID = RestAlarmReceiver.CHANNEL_ID;
    private static final int REST_NOTIFICATION_ID = RestAlarmReceiver.REST_NOTIFICATION_ID;
    private boolean exactAlarmSettingsOpened = false;

    private WebView webView;
    private FrameLayout rootLayout;

    private ValueCallback<Uri[]> filePathCallback;
    private String pendingBackupFileName;
    private String pendingBackupJson;

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
        webView.addJavascriptInterface(new BackupBridge(this), "AndroidBackup");

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

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(
                    WebView view,
                    ValueCallback<Uri[]> callback,
                    FileChooserParams params
            ) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }

                filePathCallback = callback;

                Intent intent;
                try {
                    intent = params.createIntent();
                } catch (Exception ex) {
                    intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                }

                intent.setAction(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{
                            "application/json",
                            "text/json",
                            "text/plain",
                            "application/octet-stream"
                    });
                }

                try {
                    startActivityForResult(intent, BACKUP_FILE_CHOOSER_REQUEST);
                } catch (Exception ex) {
                    Log.e(TAG, "Não foi possível abrir o seletor de backup.", ex);
                    if (filePathCallback != null) {
                        filePathCallback.onReceiveValue(null);
                        filePathCallback = null;
                    }
                }
                return true;
            }
        });

        // Cache-bust the top-level document so each native APK version loads the current web app.
        webView.loadUrl("https://matheusboettger7.github.io/Treino_Trinca/?nativeVersion=2026.10.08.73");

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

    public class BackupBridge {
        private final Context context;

        BackupBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void saveBackup(String fileName, String json) {
            if (json == null || json.isEmpty()) {
                runOnUiThread(() ->
                        Toast.makeText(context, "Não há dados para exportar.", Toast.LENGTH_SHORT).show()
                );
                return;
            }

            runOnUiThread(() -> openBackupSaveDialog(fileName, json));
        }
    }

    private void openBackupSaveDialog(String fileName, String json) {
        pendingBackupFileName =
                (fileName == null || fileName.trim().isEmpty())
                        ? "treino-trinca-backup.json"
                        : fileName.trim();
        pendingBackupJson = json;

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, pendingBackupFileName);

        try {
            startActivityForResult(intent, BACKUP_CREATE_DOCUMENT_REQUEST);
        } catch (Exception ex) {
            Log.e(TAG, "Não foi possível abrir o salvamento do backup.", ex);
            clearPendingBackup();
            Toast.makeText(
                    this,
                    "Não foi possível abrir o local para salvar o backup.",
                    Toast.LENGTH_LONG
            ).show();
        }
    }

    private void saveBackupToUri(Uri uri) {
        if (uri == null || pendingBackupJson == null) {
            clearPendingBackup();
            return;
        }

        try (OutputStream output = getContentResolver().openOutputStream(uri)) {
            if (output == null) {
                throw new IllegalStateException("Não foi possível abrir o arquivo para escrita.");
            }

            output.write(pendingBackupJson.getBytes(StandardCharsets.UTF_8));
            output.flush();

            Toast.makeText(
                    this,
                    "Backup exportado com sucesso.",
                    Toast.LENGTH_SHORT
            ).show();
        } catch (Exception ex) {
            Log.e(TAG, "Falha ao salvar backup.", ex);
            Toast.makeText(
                    this,
                    "Não foi possível salvar o backup.",
                    Toast.LENGTH_LONG
            ).show();
        } finally {
            clearPendingBackup();
        }
    }

    private void clearPendingBackup() {
        pendingBackupFileName = null;
        pendingBackupJson = null;
    }

    @Override
    protected void onResume() {
        super.onResume();

        AlarmManager alarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager.canScheduleExactAlarms()) {
            exactAlarmSettingsOpened = false;
        }

        if (webView != null) {
            webView.postDelayed(() ->
                    webView.evaluateJavascript(
                            "window.syncRestNativeAlarm&&window.syncRestNativeAlarm();",
                            null
                    ), 250);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent resultData) {
        super.onActivityResult(requestCode, resultCode, resultData);

        if (requestCode == BACKUP_FILE_CHOOSER_REQUEST) {
            if (filePathCallback == null) return;

            Uri[] results = null;
            if (resultCode == RESULT_OK && resultData != null) {
                try {
                    results = WebChromeClient.FileChooserParams.parseResult(resultCode, resultData);
                } catch (Exception ex) {
                    Log.e(TAG, "Não foi possível interpretar o arquivo escolhido.", ex);
                }
            }

            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
            return;
        }

        if (requestCode == BACKUP_CREATE_DOCUMENT_REQUEST) {
            if (resultCode == RESULT_OK && resultData != null) {
                saveBackupToUri(resultData.getData());
            } else {
                clearPendingBackup();
            }
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
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }

        clearPendingBackup();

        if (webView != null) {
            webView.removeJavascriptInterface("AndroidNotifications");
            webView.removeJavascriptInterface("AndroidBackup");
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
