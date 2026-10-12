package om.dealbox.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

/**
 * DealBox عُمان — غلاف WebView.
 * يحمّل الموقع من الرابط المضبوط في res/values/strings.xml (webapp_url)
 * ويحتفظ بتجربة تطبيق كاملة: تشغيل JS، تخزين محلي، زر الرجوع، وصفحة خطأ.
 *
 * كما يوفّر تسجيل الدخول عبر Google بشكل أصلي (Native) لأن WebView لا يدعم
 * نافذة Google المنبثقة. الواجهة تنادي الجسر AndroidGoogle.signIn(clientId)
 * فيُفتح مُنتقي الحساب الأصلي، ثم يُعاد رمز الهوية (idToken) للواجهة عبر
 * window.__dealboxGoogleNativeToken(idToken) لإكمال الدخول عبر الخادم.
 */
public class MainActivity extends Activity {

    private static final String TAG = "DealBox";
    private static final int RC_SIGN_IN = 9001;

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout errorLayout;
    private TextView errorText;
    private Button retryButton;

    /** عميل تسجيل Google — يُبنى عند كل محاولة دخول بمعرّف العميل الوارد من الواجهة. */
    private GoogleSignInClient googleSignInClient;

    /** الرابط الأساسي — يُضبط من strings.xml (انظر README للتفاصيل). */
    private String getStartUrl() {
        return getString(R.string.webapp_url);
    }

    /** واجهة الجسر المكشوفة للواجهة الويب باسم AndroidGoogle */
    private class AndroidGoogleBridge {
        /** يبدأ تسجيل الدخول الأصلي عبر Google. clientId = معرّف عميل الويب (Web client id). */
        @JavascriptInterface
        public void signIn(final String clientId) {
            runOnUiThread(() -> {
                if (clientId == null || clientId.trim().isEmpty()) {
                    notifyWeb(false, "معرّف Google Client ID غير مُعدّ");
                    return;
                }
                GoogleSignInOptions options = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                        .requestIdToken(clientId.trim())
                        .requestEmail()
                        .build();
                googleSignInClient = GoogleSignIn.getClient(MainActivity.this, options);
                // نخرج من أي جلسة سابقة ليعرض مُنتقي الحساب دائماً
                googleSignInClient.signOut().addOnCompleteListener(task -> {
                    Intent intent = googleSignInClient.getSignInIntent();
                    startActivityForResult(intent, RC_SIGN_IN);
                });
            });
        }
    }

    /** يمرّر رمز الهوية أو الخطأ للواجهة الويب عبر دالة JavaScript عالمية. */
    private void notifyWeb(boolean success, String payload) {
        if (webView == null) return;
        final String js = success
                ? "window.__dealboxGoogleNativeToken && window.__dealboxGoogleNativeToken(" + quote(payload) + ");"
                : "window.__dealboxGoogleNativeError && window.__dealboxGoogleNativeError(" + quote(payload) + ");";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    /** يهرّب نصاً إلى سلسلة JavaScript آمنة (بديل JSON.stringify البسيط). */
    private String quote(String value) {
        if (value == null) return "null";
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        sb.append("\"");
        return sb.toString();
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        progressBar = findViewById(R.id.progressBar);
        errorLayout = findViewById(R.id.errorLayout);
        errorText = findViewById(R.id.errorText);
        retryButton = findViewById(R.id.retryButton);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        // كشف الجسر للواجهة: window.AndroidGoogle.signIn('...')
        webView.addJavascriptInterface(new AndroidGoogleBridge(), "AndroidGoogle");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                progressBar.setVisibility(View.GONE);
                errorLayout.setVisibility(View.GONE);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request != null && request.isForMainFrame()) {
                    progressBar.setVisibility(View.GONE);
                    errorText.setText(R.string.webapp_offline);
                    errorLayout.setVisibility(View.VISIBLE);
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return false;
                String url = request.getUrl().toString();
                // الروابط الخارجية (بريد/هاتف/واتساب) تُفتح في التطبيق النظامي
                if (url.startsWith("mailto:") || url.startsWith("tel:") || url.startsWith("whatsapp:")) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                    } catch (ActivityNotFoundException ignored) {
                        // التطبيق غير مثبت — تجاهل
                    }
                    return true;
                }
                // بقية الروابط تبقى داخل التطبيق
                return false;
            }
        });

        retryButton.setOnClickListener(v -> {
            errorLayout.setVisibility(View.GONE);
            webView.loadUrl(getStartUrl());
        });

        webView.loadUrl(getStartUrl());
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                String idToken = account != null ? account.getIdToken() : null;
                if (idToken != null && !idToken.isEmpty()) {
                    notifyWeb(true, idToken);
                } else {
                    notifyWeb(false, "لم يُرجع Google رمز تحقق صالحاً");
                }
            } catch (ApiException e) {
                Log.w(TAG, "Google sign-in failed: " + e.getStatusCode(), e);
                String message;
                if (e.getStatusCode() == 12501) {
                    // المستخدم أغلق نافذة اختيار الحساب دون اختيار
                    message = "ألغى المستخدم تسجيل الدخول عبر Google";
                } else if (e.getStatusCode() == 10) {
                    message = "إعداد Google غير مطابق — تحقق من SHA-1 واسم الحزمة في Google Cloud";
                } else {
                    message = "تعذر تسجيل الدخول عبر Google (رمز " + e.getStatusCode() + ")";
                }
                notifyWeb(false, message);
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        webView.onResume();
    }

    @Override
    protected void onPause() {
        webView.onPause();
        super.onPause();
    }
}
