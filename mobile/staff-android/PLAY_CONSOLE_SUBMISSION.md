# AN-Industry Staff — Google Play submission pack

## Distribution recommendation

Managed Google Play private app for AN-Industry employees. The app is not intended for public consumer distribution.

## Core functionality declaration

AN-Industry Staff is an authenticated enterprise sales and financial reconciliation application. An authorised CASHIER may opt in to receiving new E-Birr and CBE business-payment SMS notifications. The app extracts only the payment provider, reference, amount, sender information when present, received time and a duplicate-prevention hash, then sends those fields over HTTPS to the organisation’s server so the cashier can match the payment to a sale.

Without payment confirmation, the cashier cannot safely release remote customer orders without calling another employee. The SMS payment reader is therefore a critical cashier workflow. Other staff roles never receive the SMS permission prompt.

## Requested restricted permission

- `android.permission.RECEIVE_SMS`
- No `READ_SMS`, `SEND_SMS`, call-log, contacts, accessibility or all-files permission.

Suggested permitted-use selection: **SMS-based money management**. If Google requests enterprise classification evidence, additionally explain that the app requires corporate login and is distributed privately to employees; do not select unrelated use cases.

## Data minimisation evidence

- New messages only; no historical inbox access.
- Parser ignores messages that are not clearly incoming E-Birr/CBE payments.
- Parser rejects OTP, PIN, password, passcode, verification-code and secret-code messages.
- Full SMS bodies are neither retained nor uploaded.
- Device token is issued only after authenticated CASHIER registration.
- Server rejects non-cashier, inactive or disabled devices.
- User can decline consent and continue using non-SMS features.

## Reviewer access

Provide Google with a dedicated CASHIER test account, the production/private testing URL, and an E-Birr/CBE sample payment message that contains no real customer data. Never include a real password in this repository.

## Review video checklist

1. Launch the app and show AN-Industry branding.
2. Sign in with the dedicated CASHIER review account.
3. Open Cashier payment reader and choose the company E-Birr/CBE account.
4. Tap “Diiwaangeli oo shid SMS reader”.
5. Show the complete prominent disclosure.
6. Demonstrate “Not Now” and show that the rest of the app remains usable.
7. Repeat the flow, choose “Agree & Continue”, then grant Android RECEIVE_SMS.
8. Deliver a synthetic incoming-payment SMS and show the unmatched payment in the sales workflow.
9. Show how the reader is disabled and permission revoked.

## Play Console App content

- Publish the privacy policy at `/privacy/staff-app` and enter its public HTTPS URL.
- Complete Data safety for financial/payment information and SMS-derived data actually transmitted.
- Declare encrypted transit (HTTPS), access controls, retention and deletion/correction contact.
- Declare no ads and no sale of personal or sensitive data.
- Provide login instructions and the review video.
- Submit the Permissions Declaration Form with the exact core-use explanation above.

## Store listing draft

**Name:** AN-Industry Staff

**Short description:** Secure staff sales, production and cashier payment reconciliation for AN-Industry.

**Full description:** AN-Industry Staff is the private employee workspace for authorised AN-Industry operations. Staff can access role-appropriate sales, production, customer and reporting workflows. A designated cashier can optionally enable new E-Birr and CBE payment notification processing to match incoming business payments to sales. The app does not read historical SMS messages or process OTP, PIN, password or personal messages.
