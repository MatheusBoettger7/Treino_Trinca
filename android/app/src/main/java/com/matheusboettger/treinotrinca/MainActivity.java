package com.matheusboettger.treinotrinca;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.Window;
import android.view.View;
import android.widget.FrameLayout;
import android.graphics.Color;

public class MainActivity extends Activity {
    private static final int NOTIFICATION_PERMISSION_REQUEST = 43;
    private static final String CHANNEL_ID = "treino_trinca_rest";
    private static final int REST_NOTIFICATION_ID = 4301;

    private WebView webView;
    private FrameLayout rootLayout;
    private final Handler handler = new Handler();
    private Runnable restNotificationRunnable;

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
        webView.loadUrl("https://matheusboettger7.github.io/Treino_Trinca/?nativeVersion=2026.09.21.53");

        requestNotificationPermission();
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, NOTIFICATION_PERMISSION_REQUEST);
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

    private void scheduleRestNotification(int seconds) {
        cancelRestNotification();
        if (seconds <= 0) return;

        restNotificationRunnable = () -> showRestNotification();
        handler.postDelayed(restNotificationRunnable, seconds * 1000L);
    }

    private void cancelRestNotification() {
        if (restNotificationRunnable != null) {
            handler.removeCallbacks(restNotificationRunnable);
            restNotificationRunnable = null;
        }
    }

    private void showRestNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                4301,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        android.app.Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new android.app.Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new android.app.Notification.Builder(this);
        }

        builder.setSmallIcon(com.matheusboettger.treinotrinca.R.drawable.ic_launcher)
                .setContentTitle("Descanso concluído! ⏱️")
                .setContentText("Hora de voltar para a próxima série. 💪")
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setPriority(android.app.Notification.PRIORITY_HIGH)
                .setVibrate(new long[]{0, 250, 120, 250});

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        manager.notify(REST_NOTIFICATION_ID, builder.build());
        restNotificationRunnable = null;
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
                cancelRestNotification();
                showRestNotification();
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
        cancelRestNotification();
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