package com.vidlink.pro4k;

import android.os.Bundle;
import android.os.SystemClock;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public class TVInterface {
        @JavascriptInterface
        public void clickAt(final float x, final float y) {
            runOnUiThread(() -> {
                if (bridge != null && bridge.getWebView() != null) {
                    final WebView webView = bridge.getWebView();
                    final long downTime = SystemClock.uptimeMillis();

                    MotionEvent down = MotionEvent.obtain(
                        downTime,
                        downTime,
                        MotionEvent.ACTION_DOWN,
                        x,
                        y,
                        0
                    );
                    webView.dispatchTouchEvent(down);
                    down.recycle();

                    webView.postDelayed(() -> {
                        long upTime = SystemClock.uptimeMillis();
                        MotionEvent up = MotionEvent.obtain(
                            downTime,
                            upTime,
                            MotionEvent.ACTION_UP,
                            x,
                            y,
                            0
                        );
                        webView.dispatchTouchEvent(up);
                        up.recycle();
                    }, 65);
                }
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            WebSettings settings = webView.getSettings();

            // Enable smooth streaming media playback & caching
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setCacheMode(WebSettings.LOAD_DEFAULT);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

            // Block video embed popup ads from hijacking TV display
            settings.setSupportMultipleWindows(false);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);

            // Register native TV touch bridge for virtual cursor
            webView.addJavascriptInterface(new TVInterface(), "AndroidTV");
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        // Forward TV remote Back button to React app for modal/navigation handling
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true }));",
                    null
                );
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
