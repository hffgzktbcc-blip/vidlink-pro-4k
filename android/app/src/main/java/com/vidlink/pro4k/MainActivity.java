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
        if (bridge != null && bridge.getWebView() != null) {
            // Forward TV remote Back button (KeyCode 4)
            if (keyCode == KeyEvent.KEYCODE_BACK) {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, code: 'Escape', bubbles: true }));",
                    null
                );
                return true;
            }

            // Forward TV remote D-Pad Center (OK button, KeyCode 23)
            if (keyCode == KeyEvent.KEYCODE_DPAD_CENTER) {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, code: 'Enter', bubbles: true }));",
                    null
                );
                return true;
            }

            // Forward TV remote Media Play/Pause (KeyCode 85, 126, 127)
            if (keyCode == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE || keyCode == KeyEvent.KEYCODE_MEDIA_PLAY || keyCode == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'MediaPlayPause', keyCode: 85, code: 'MediaPlayPause', bubbles: true }));",
                    null
                );
                return true;
            }

            // Forward TV remote Media Rewind (KeyCode 89)
            if (keyCode == KeyEvent.KEYCODE_MEDIA_REWIND) {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'MediaRewind', keyCode: 89, code: 'MediaRewind', bubbles: true }));",
                    null
                );
                return true;
            }

            // Forward TV remote Media Fast Forward (KeyCode 90)
            if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD) {
                bridge.getWebView().evaluateJavascript(
                    "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'MediaFastForward', keyCode: 90, code: 'MediaFastForward', bubbles: true }));",
                    null
                );
                return true;
            }
        }
        return super.onKeyDown(keyCode, event);
    }
}
