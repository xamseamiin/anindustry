export const metadata = {
  title: 'AN-Industry Staff App Privacy Policy',
  description: 'Privacy and SMS payment processing policy for the AN-Industry Staff Android app.'
};

export default function StaffAppPrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-slate-200">
      <article className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl">
        <header>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">AN-INDUSTRY</p>
          <h1 className="mt-2 text-2xl font-black text-white">Staff App Privacy Policy</h1>
          <p className="mt-2 text-xs text-slate-400">Effective: 21 September 2026</p>
        </header>
        <section><h2 className="font-black text-white">Purpose</h2><p className="mt-2 text-sm leading-6">AN-Industry Staff is an internal business application for authorised employees. Its cashier payment reader matches new E-Birr and CBE payment notifications to company sales and accounting records.</p></section>
        <section><h2 className="font-black text-white">SMS access</h2><p className="mt-2 text-sm leading-6">Only a signed-in user with the CASHIER role can enable SMS access. The app requests RECEIVE_SMS only after a clear in-app disclosure and affirmative consent. It does not request READ_SMS, does not read historical messages, and does not process OTP, PIN, password or personal messages.</p></section>
        <section><h2 className="font-black text-white">Data processed</h2><p className="mt-2 text-sm leading-6">For recognised incoming business payments, the app may process the provider, transaction reference, amount, sender name or phone when present, receiving time and a duplicate-prevention hash. The complete SMS body is not stored by the app or sent to the server.</p></section>
        <section><h2 className="font-black text-white">Use and sharing</h2><p className="mt-2 text-sm leading-6">Payment data is sent over HTTPS only to AN-Industry systems to reconcile sales and company accounts. It is not sold, used for advertising or shared with unrelated third parties.</p></section>
        <section><h2 className="font-black text-white">Choice and control</h2><p className="mt-2 text-sm leading-6">The cashier may choose Not Now, revoke SMS permission in Android Settings or disable the reader. The rest of the staff application remains available without SMS permission.</p></section>
        <section><h2 className="font-black text-white">Security and retention</h2><p className="mt-2 text-sm leading-6">Access is restricted by employee login, role, approved device token and company account. Financial records are retained according to company accounting requirements. Device access can be disabled by AN-Industry administration.</p></section>
        <section><h2 className="font-black text-white">Contact</h2><p className="mt-2 text-sm leading-6">Privacy questions or deletion/correction requests should be submitted to AN-Industry management through the organisation’s official support channel.</p></section>
      </article>
    </main>
  );
}
