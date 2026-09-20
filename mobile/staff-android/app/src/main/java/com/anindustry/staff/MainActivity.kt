package com.anindustry.staff

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import java.util.UUID
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private val trustedHost: String by lazy { Uri.parse(BuildConfig.STAFF_PORTAL_URL).host.orEmpty() }
    private val smsPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        webView = WebView(this)
        setContentView(webView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                if (uri.scheme == "https" && uri.host == trustedHost) return false
                startActivity(Intent(Intent.ACTION_VIEW, uri))
                return true
            }
        }
        webView.webChromeClient = WebChromeClient()
        webView.addJavascriptInterface(StaffBridge(this), "ANStaffBridge")
        webView.loadUrl(BuildConfig.STAFF_PORTAL_URL)
    }

    fun requestSmsPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            smsPermission.launch(Manifest.permission.RECEIVE_SMS)
        }
    }
}

/** Exposed only to the trusted staff portal loaded inside this WebView. */
class StaffBridge(private val activity: MainActivity) {
    @JavascriptInterface
    fun getDeviceFingerprint(): String {
        val preferences = activity.getSharedPreferences("payment_bridge", Context.MODE_PRIVATE)
        val existing = preferences.getString("fingerprint", null)
        if (existing != null) return existing
        return UUID.randomUUID().toString().also { preferences.edit().putString("fingerprint", it).apply() }
    }

    @JavascriptInterface
    fun enableCashierPaymentReader(json: String) {
        val data = JSONObject(json)
        val config = activity.getSharedPreferences("payment_bridge", Context.MODE_PRIVATE)
        config.edit()
            .putString("deviceToken", data.getString("deviceToken"))
            .putString("endpoint", BuildConfig.PAYMENT_BRIDGE_URL)
            .putString("ebirrAccountId", data.optString("ebirrAccountId"))
            .putString("cbeAccountId", data.optString("cbeAccountId"))
            .putBoolean("enabled", true)
            .apply()
        activity.requestSmsPermission()
    }

    @JavascriptInterface
    fun disableCashierPaymentReader() {
        val preferences = activity.getSharedPreferences("payment_bridge", Context.MODE_PRIVATE)
        preferences.edit().remove("deviceToken").remove("endpoint").remove("ebirrAccountId").remove("cbeAccountId").putBoolean("enabled", false).apply()
    }
}
