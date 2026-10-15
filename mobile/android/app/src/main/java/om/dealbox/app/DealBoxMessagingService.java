package om.dealbox.app;

import android.util.Log;

import androidx.annotation.NonNull;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

/**
 * مستقبل إشعارات Firebase Cloud Messaging.
 *
 * - onNewToken: عند تجديد توكن الجهاز نُسجّله في الخادم.
 * - onMessageReceived: عند وصول رسالة (والتطبيق في المقدمة) نعرضها كإشعار نظام.
 *   أما إذا كان التطبيق في الخلفية/مغلق فالنظام يعرض الإشعار تلقائياً
 *   (لأننا نرسل حقل notification من الخادم) حتى لو الهاتف في وضع السكون.
 */
public class DealBoxMessagingService extends FirebaseMessagingService {

    private static final String TAG = "DealBox";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.i(TAG, "FCM token جديد — تسجيله في الخادم.");
        DealBoxPush.sendTokenToServer(this, token);
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        super.onMessageReceived(message);

        String title = null;
        String body = null;
        String url = null;

        Map<String, String> data = message.getData();
        if (data != null) {
            title = data.get("title");
            body = data.get("body");
            url = data.get("url");
        }
        if (message.getNotification() != null) {
            if (title == null) title = message.getNotification().getTitle();
            if (body == null) body = message.getNotification().getBody();
        }
        if (title == null || title.isEmpty()) title = getString(R.string.app_name);
        if (body == null) body = "";

        DealBoxPush.showNotification(this, title, body, url);
    }
}
