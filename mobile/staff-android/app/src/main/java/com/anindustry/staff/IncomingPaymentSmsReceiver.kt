package com.anindustry.staff

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import java.time.Instant
import kotlin.concurrent.thread

class IncomingPaymentSmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return
        val pendingResult = goAsync()
        thread {
            try {
                val config = context.getSharedPreferences("payment_bridge", Context.MODE_PRIVATE)
                if (!config.getBoolean("enabled", false)) return@thread
                val body = Telephony.Sms.Intents.getMessagesFromIntent(intent).joinToString("") { it.messageBody ?: "" }
                val sender = Telephony.Sms.Intents.getMessagesFromIntent(intent).firstOrNull()?.originatingAddress.orEmpty()
                val payment = PaymentSmsParser.parse(sender, body, config.getString("ebirrAccountId", "").orEmpty(), config.getString("cbeAccountId", "").orEmpty()) ?: return@thread
                send(config.getString("endpoint", "").orEmpty(), config.getString("deviceToken", "").orEmpty(), payment)
            } finally { pendingResult.finish() }
        }
    }

    private fun send(endpoint: String, token: String, payment: ParsedPayment) {
        if (endpoint.isBlank() || token.isBlank()) return
        val connection = (URL(endpoint).openConnection() as HttpURLConnection)
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 15_000
            connection.readTimeout = 15_000
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("x-an-device-token", token)
            connection.doOutput = true
            connection.outputStream.use { it.write(payment.toJson().toString().toByteArray()) }
            connection.inputStream.close()
        } finally { connection.disconnect() }
    }
}

data class ParsedPayment(val provider: String, val accountId: String, val reference: String, val amount: Double, val senderName: String?, val senderPhone: String?, val hash: String) {
    fun toJson() = JSONObject().apply {
        put("provider", provider); put("accountId", accountId); put("providerReference", reference)
        put("amount", amount); put("senderName", senderName); put("senderPhone", senderPhone)
        put("messageHash", hash); put("receivedAt", Instant.now().toString())
    }
}

/** Conservative parser: it only accepts messages that clearly say money was received.
 * Unknown templates are ignored and must be added after a real cashier-device test. */
object PaymentSmsParser {
    fun parse(sender: String, message: String, ebirrAccountId: String, cbeAccountId: String): ParsedPayment? {
        val normalized = message.replace(',', ' ')
        val normalizedSender = sender.replace(Regex("[^A-Za-z0-9]"), "")
        // Never process authentication or secret-bearing messages, even if a
        // provider name and an amount happen to be present.
        if (Regex("(?i)\\b(OTP|PIN|PASSWORD|PASSCODE|VERIFICATION CODE|SECRET CODE)\\b").containsMatchIn(message)) return null
        val provider = when {
            normalizedSender.contains("ebirr", true) || message.contains("e-birr", true) || message.contains("ebirr", true) -> "EBIRR"
            normalizedSender.contains("cbe", true) || message.contains("cbe birr", true) || message.contains("commercial bank", true) -> "CBE"
            else -> return null
        }
        if (!Regex("(?i)(received|credited|deposit|lacag.*soo|ku.*shub)").containsMatchIn(message)) return null
        val amountText = Regex("(?i)(?:ETB|birr)\\s*([0-9]+(?:\\.[0-9]{1,2})?)|([0-9]+(?:\\.[0-9]{1,2})?)\\s*(?:ETB|birr)").find(message)?.groupValues?.drop(1)?.firstOrNull { it.isNotBlank() } ?: return null
        val amount = amountText.toDoubleOrNull() ?: return null
        val reference = Regex("(?i)(?:ref(?:erence)?|receipt|transaction|txn)(?:\\s*(?:no|id))?\\s*[:#-]?\\s*([A-Z0-9-]{5,})").find(message)?.groupValues?.getOrNull(1)
            ?: sha256("$sender|$message").take(24)
        val accountId = if (provider == "EBIRR") ebirrAccountId else cbeAccountId
        if (accountId.isBlank()) return null
        return ParsedPayment(provider, accountId, reference, amount, null, null, sha256("$sender|$message"))
    }

    private fun sha256(value: String) = MessageDigest.getInstance("SHA-256").digest(value.toByteArray()).joinToString("") { "%02x".format(it) }
}
