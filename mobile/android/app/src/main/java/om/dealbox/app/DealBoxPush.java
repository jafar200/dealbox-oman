package om.dealbox.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * مساعد إشعارات تطبيق DealBox (Firebase Cloud Messaging).
 *
 * يعرض التنبيه العام كإشعار نظام يظهر على شاشة القفل حتى لو التطبيق مغلق،
 * ويسجّل توكن الجهاز في خادم DealBox ليتمكّن الآدمن من إرسال التنبيه لكل الأجهزة.
 *
 * ملاحظة: كل هذا يعمل فقط عند وجود ملف google-services.json (مشروع Firebase).
 * بدون الملف يتخطّى كل شيء بهدوء والتطبيق يعمل عادي.
 */
public final class DealBoxPush {

    private static final String TAG = "DealBox";
    private static final int NOTIFICATION_ID = 7500;

    private DealBoxPush() {
    }

    /** هل تهيّأ Firebase في هذا التطبيق؟ (يحتاج google-services.json وقت البناء) */
    public static boolean isFirebaseReady(Context context) {
        try {
            return !FirebaseApp.getApps(context).isEmpty();
        } catch (Throwable t) {
            return false;
        }
    }

    /** إنشاء قناة الإشعارات (أندرويد 8+). */
    public static void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null) return;
        NotificationChannel channel = new NotificationChannel(
                context.getString(R.string.dealbox_channel_id),
                context.getString(R.string.dealbox_channel_name),
                NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription(context.getString(R.string.dealbox_channel_description));
        manager.createNotificationChannel(channel);
    }

    /** عرض الإشعار في شريط الإشعارات/شاشة القفل. */
    public static void showNotification(Context context, String title, String body, String url) {
        createNotificationChannel(context);
        if (!hasNotificationPermission(context)) {
            Log.i(TAG, "صلاحية الإشعارات غير ممنوحة — تخطّي العرض.");
            return;
        }

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (url != null && !url.isEmpty()) {
            intent.putExtra(MainActivity.EXTRA_OPEN_URL, url);
        }
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, NOTIFICATION_ID, intent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(
                context, context.getString(R.string.dealbox_channel_id))
                .setSmallIcon(R.drawable.ic_stat_dealbox)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        try {
            NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, builder.build());
        } catch (SecurityException e) {
            Log.w(TAG, "تعذّر عرض الإشعار: " + e.getMessage());
        }
    }

    private static boolean hasNotificationPermission(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true;
        return ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.POST_NOTIFICATIONS)
                == PackageManager.PERMISSION_GRANTED;
    }

    /** يجلب توكن FCM (إن كان Firebase مهيأ) ويسجّله في خادم DealBox. */
    public static void registerDevice(Context context) {
        if (!isFirebaseReady(context)) {
            Log.i(TAG, "Firebase غير مهيأ (لا يوجد google-services.json) — تخطّي تسجيل الجهاز.");
            return;
        }
        FirebaseMessaging.getInstance().getToken()
                .addOnSuccessListener(token -> sendTokenToServer(context, token))
                .addOnFailureListener(e -> Log.w(TAG, "FCM getToken failed: " + e.getMessage()));
    }

    /** إرسال التوكن إلى الخادم عبر طلب HTTP بسيط (بدون مكتبة خارجية). */
    public static void sendTokenToServer(final Context context, final String token) {
        if (token == null || token.isEmpty()) return;
        final Context appContext = context.getApplicationContext();
        new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                String base = appContext.getString(R.string.api_base_url).trim();
                URL url = new URL(base + "/api/v1/client/push/register-device");
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);
                connection.setDoOutput(true);

                JSONObject payload = new JSONObject();
                payload.put("token", token);
                payload.put("platform", "android");

                try (OutputStream os = connection.getOutputStream()) {
                    os.write(payload.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = connection.getResponseCode();
                Log.i(TAG, "تسجيل توكن FCM: HTTP " + code);
            } catch (Exception e) {
                Log.w(TAG, "تعذّر تسجيل توكن FCM: " + e.getMessage());
            } finally {
                if (connection != null) connection.disconnect();
            }
        }).start();
    }
}
