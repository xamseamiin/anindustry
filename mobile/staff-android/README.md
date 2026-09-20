# AN-Industry Staff Android App

This is an internal Android APK companion for the existing AN-Industry web and Telegram Mini App. It opens the staff portal and, on an approved cashier device only, receives **new** E-Birr/CBE payment SMS messages.

It does not request `READ_SMS`, does not scan old messages, and rejects messages that do not clearly indicate an incoming payment. OTP/PIN messages must never be parsed, retained, or sent.

## Release prerequisites

1. Deploy the Next.js backend and apply `20260920090000_staff_app_payments` only after a database backup.
2. Build with `-PAN_INDUSTRY_BASE_URL=https://your-production-domain`. The app then opens `/staff` and sends payment events to the same server's API.
3. Build and sign the APK in Android Studio.
4. A signed-in cashier registers one Android device and explicitly enables the SMS reader. The one-time device token is stored only on that device.
5. Configure the E-Birr and CBE account IDs for that cashier device.

The SMS parser intentionally begins conservatively. Capture anonymised examples of the genuine E-Birr and CBE incoming-payment templates, then add tested patterns before enabling it in production.
