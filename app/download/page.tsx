'use client';

import Link from 'next/link';

const APK_PATH = '/downloads/AN-Industry-Staff-v0.1.0-debug.apk';

export default function StaffAppDownloadPage() {
  const downloadAndroidApp = () => {
    const apkUrl = new URL(APK_PATH, window.location.origin).toString();
    const telegram = (window as Window & {
      Telegram?: { WebApp?: { openLink?: (url: string, options?: { try_instant_view?: boolean }) => void } };
    }).Telegram?.WebApp;

    if (telegram?.openLink) {
      telegram.openLink(apkUrl, { try_instant_view: false });
      return;
    }

    window.location.assign(apkUrl);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
      <div className="mx-auto max-w-md rounded-3xl border border-cyan-400/25 bg-slate-900 p-7 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-400 text-4xl text-slate-950">A</div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">AN-INDUSTRY</p>
        <h1 className="mt-2 text-2xl font-black">Staff App</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">App-ka shaqaalaha ee Sales, Production, Customers iyo Staff Portal.</p>
        <button type="button" onClick={downloadAndroidApp} className="mt-7 block w-full rounded-2xl bg-emerald-400 px-5 py-4 text-sm font-black text-slate-950 transition hover:bg-emerald-300">Download Android App</button>
        <Link href="/staff" className="mt-3 block rounded-2xl border border-white/15 px-5 py-4 text-sm font-bold text-slate-200">Open Staff Portal</Link>
        <div className="mt-7 rounded-2xl bg-slate-950/70 p-4 text-left text-xs leading-6 text-slate-400">
          <p className="font-black text-white">Rakibidda</p>
          <p>1. Download garee APK-ga.</p>
          <p>2. Android-ka u oggolow Install unknown apps.</p>
          <p>3. Fur app-ka oo ku gal account-kaaga shaqada.</p>
        </div>
        <p className="mt-6 text-[10px] font-bold text-slate-500">Internal company distribution · v0.1.0</p>
      </div>
    </main>
  );
}
