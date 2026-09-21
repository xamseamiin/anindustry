package com.anindustry.staff

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
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
    private val smsPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (!granted) {
            getSharedPreferences("payment_bridge", Context.MODE_PRIVATE).edit()
                .putBoolean("enabled", false)
                .apply()
            Toast.makeText(this, "SMS reader lama shidin. App-ka intiisa kale waad isticmaali kartaa.", Toast.LENGTH_LONG).show()
        } else {
            Toast.makeText(this, "E-Birr/CBE payment reader waa la shiday.", Toast.LENGTH_LONG).show()
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(2, 6, 23)) }
        webView = WebView(this)
        val splash = createSplashView()
        root.addView(webView, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        root.addView(splash, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
        setContentView(root)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = false
        webView.settings.allowContentAccess = false
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String) {
                splash.animate().alpha(0f).setDuration(250).withEndAction { splash.visibility = View.GONE }.start()
            }

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

    private fun createSplashView(): View {
        val density = resources.displayMetrics.density
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setPadding((32 * density).toInt(), 0, (32 * density).toInt(), 0)
            setBackgroundColor(Color.rgb(2, 6, 23))
            addView(ImageView(context).apply {
                setImageResource(R.drawable.an_industry_logo)
                adjustViewBounds = true
            }, LinearLayout.LayoutParams((260 * density).toInt(), (150 * density).toInt()))
            addView(TextView(context).apply {
                text = "STAFF OPERATIONS"
                textSize = 13f
                gravity = Gravity.CENTER
                setTextColor(Color.rgb(103, 232, 249))
                letterSpacing = 0.16f
            })
        }
    }

    fun showSmsDisclosureAndRequest(configJson: String) {
        runOnUiThread {
            AlertDialog.Builder(this)
                .setTitle("E-Birr & CBE payment SMS")
                .setMessage(
                    "AN-Industry Staff wuxuu qabanayaa SMS-yada cusub ee lacagaha ganacsiga ee E-Birr iyo CBE si loogu xaqiijiyo iibka iyo accounts-ka shirkadda.\n\n" +
                        "App-ku ma akhriyo SMS-yadii hore, mana diraayo OTP, PIN ama fariimo shakhsiyadeed. Xogta payment-ka (provider, reference, amount iyo sender haddii uu ku jiro) oo keliya ayaa loo diraa server-ka AN-Industry.\n\n" +
                        "Oggolaanshahan waxaa isticmaali kara CASHIER-ka la fasaxay oo keliya. Waad diidi kartaa, app-kana intiisa kale wuu shaqaynayaa."
                )
                .setPositiveButton("Agree & Continue") { _, _ ->
                    saveReaderConfiguration(configJson)
                    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
                        smsPermission.launch(Manifest.permission.RECEIVE_SMS)
                    } else {
                        Toast.makeText(this, "E-Birr/CBE payment reader waa la shiday.", Toast.LENGTH_LONG).show()
                    }
                }
                .setNegativeButton("Not Now") { _, _ ->
                    getSharedPreferences("payment_bridge", Context.MODE_PRIVATE).edit().putBoolean("enabled", false).apply()
                }
                .setCancelable(false)
                .show()
        }
    }

    private fun saveReaderConfiguration(json: String) {
        val data = JSONObject(json)
        getSharedPreferences("payment_bridge", Context.MODE_PRIVATE).edit()
            .putString("deviceToken", data.getString("deviceToken"))
            .putString("endpoint", BuildConfig.PAYMENT_BRIDGE_URL)
            .putString("ebirrAccountId", data.optString("ebirrAccountId"))
            .putString("cbeAccountId", data.optString("cbeAccountId"))
            .putBoolean("enabled", true)
            .putBoolean("consentGranted", true)
            .apply()
    }

    fun hasSmsPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
    }

    fun disableSmsReader() {
        getSharedPreferences("payment_bridge", Context.MODE_PRIVATE).edit()
            .remove("deviceToken")
            .remove("endpoint")
            .remove("ebirrAccountId")
            .remove("cbeAccountId")
            .putBoolean("enabled", false)
            .putBoolean("consentGranted", false)
            .apply()
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
        // The token is not persisted until the cashier explicitly accepts the
        // native prominent disclosure immediately before Android's permission.
        activity.showSmsDisclosureAndRequest(json)
    }

    @JavascriptInterface
    fun isSmsReaderAllowed(): Boolean = activity.hasSmsPermission()

    @JavascriptInterface
    fun disableCashierPaymentReader() {
        activity.disableSmsReader()
    }
}
