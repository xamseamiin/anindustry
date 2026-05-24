'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Lock, Shield, RefreshCw, XCircle, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import RevloLoader from '@/components/ui/RevloLoader';

const FaceScanner = dynamic(() => import('@/components/FaceScanner'), {
  ssr: false,
});

// Dynamically import face-api only on client
let faceapi: any = null;

interface SuperAdminGateProps {
  children: React.ReactNode;
}

export default function SuperAdminGate({ children }: SuperAdminGateProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isSudoVerified, setIsSudoVerified] = useState(false);
  const [sudoPassword, setSudoPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [sudoError, setSudoError] = useState('');
  
  // 2FA State
  const [show2FAInput, setShow2FAInput] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const [faceAttemptError, setFaceAttemptError] = useState('');

  const [faceStatus, setFaceStatus] = useState<'loading' | 'enrolled' | 'not_enrolled'>('loading');
  const [showFaceScanner, setShowFaceScanner] = useState(false);
  const [scannerMode, setScannerMode] = useState<'verify' | 'enroll'>('verify');

  // ─── Continuous Monitoring State ───
  const [isLocked, setIsLocked] = useState(false);
  const [lockReason, setLockReason] = useState<'no_face' | 'stranger' | null>(null);
  const monitorVideoRef = useRef<HTMLVideoElement | null>(null);
  const monitorStreamRef = useRef<MediaStream | null>(null);
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const noFaceCountRef = useRef(0);
  const monitorActiveRef = useRef(false);

  const NO_FACE_THRESHOLD = 10; // 10 checks * 500ms = 5 seconds

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'SUPER_ADMIN') {
        router.push('/shop/dashboard');
      } else {
        // Check face enrollment
        fetch('/api/admin/face-auth/status')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.enrolled) {
              setFaceStatus('enrolled');
              setScannerMode('verify');
              setShowFaceScanner(true);
            } else {
              setFaceStatus('not_enrolled');
            }
          })
          .catch(() => setFaceStatus('not_enrolled'));
      }
    }
  }, [status, session, router]);

  const [isCameraPaused, setIsCameraPaused] = useState(false);

  // Sync isCameraPaused with sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const interval = setInterval(() => {
      const paused = sessionStorage.getItem('faceIdPaused') === 'true';
      setIsCameraPaused(prev => {
        if (prev !== paused) return paused;
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Start/Stop Continuous Monitoring based on Pause State ───
  useEffect(() => {
    if (isSudoVerified && faceStatus === 'enrolled') {
      if (isCameraPaused) {
        stopContinuousMonitoring();
      } else {
        if (!monitorActiveRef.current) {
          startContinuousMonitoring();
        }
      }
    }
    return () => {
      stopContinuousMonitoring();
    };
  }, [isSudoVerified, faceStatus, isCameraPaused]);

  const startContinuousMonitoring = async () => {
    try {
      // Load face-api if not loaded
      if (!faceapi) {
        faceapi = await import('@vladmandic/face-api');
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }
      });

      // Create hidden video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;
      await video.play();

      monitorVideoRef.current = video;
      monitorStreamRef.current = stream;
      monitorActiveRef.current = true;
      noFaceCountRef.current = 0;

      // Start monitoring every 500ms
      monitorIntervalRef.current = setInterval(() => monitorFace(), 500);
    } catch (err) {
      console.warn('Could not start face monitoring:', err);
      // Don't block usage if monitoring fails
    }
  };

  const stopContinuousMonitoring = () => {
    monitorActiveRef.current = false;
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
    if (monitorStreamRef.current) {
      monitorStreamRef.current.getTracks().forEach(t => t.stop());
      monitorStreamRef.current = null;
    }
    if (monitorVideoRef.current) {
      monitorVideoRef.current.srcObject = null;
      monitorVideoRef.current = null;
    }
  };

  const monitorFace = async () => {
    if (!monitorVideoRef.current || !faceapi || !monitorActiveRef.current) return;

    try {
      const detection = await faceapi.detectSingleFace(
        monitorVideoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.3 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detection) {
        // No face detected
        noFaceCountRef.current++;
        if (noFaceCountRef.current >= NO_FACE_THRESHOLD) {
          // Lock after 5 seconds of no face
          triggerLock('no_face');
        }
        return;
      }

      // Face found - reset counter
      noFaceCountRef.current = 0;

      // Verify this is the correct person
      const liveDescriptor = Array.from(detection.descriptor);
      const res = await fetch('/api/admin/face-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveDescriptor })
      });
      const data = await res.json();

      if (!data.success) {
        // Stranger detected - lock immediately
        triggerLock('stranger');
      }
    } catch (err) {
      // Silently handle errors, don't block
    }
  };

  const triggerLock = (reason: 'no_face' | 'stranger') => {
    stopContinuousMonitoring();
    setIsLocked(true);
    setLockReason(reason);
    setIsSudoVerified(false);
    setShowFaceScanner(true);
    setScannerMode('verify');
  };

  const handleFaceSuccess = async (descriptor: number[]) => {
    try {
      if (scannerMode === 'verify') {
        const res = await fetch('/api/admin/face-auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ liveDescriptor: descriptor })
        });
        const data = await res.json();
        if (data.success) {
          setIsSudoVerified(true);
          setShowFaceScanner(false);
          setIsLocked(false);
          setLockReason(null);
          setFaceAttemptError('');
        } else {
          setFaceAttemptError('Kani ma ahan Maamulihii! Wajigu ma is-waafaqin.');
          setShowFaceScanner(false);
        }
      } else {
        const res = await fetch('/api/admin/face-auth/enroll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descriptor })
        });
        const data = await res.json();
        if (data.success) {
          setIsSudoVerified(true);
          setFaceStatus('enrolled');
          setShowFaceScanner(false);
        } else {
          setSudoError(data.message || 'Waa lagu guuldareystay diiwaangelinta wajiga.');
          setShowFaceScanner(false);
        }
      }
    } catch (err) {
      setSudoError('Cillad ayaa dhacday.');
      setShowFaceScanner(false);
    }
  };

  const handleSudoVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setSudoError('');
    try {
      const res = await fetch('/api/admin/verify-sudo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: sudoPassword }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.twoFAEnabled) {
          setShow2FAInput(true);
        } else {
          proceedToFaceCheck();
        }
      } else {
        setSudoError(data.error || 'Xaqiijintu way fashilantay');
      }
    } catch (err) {
      setSudoError('Cillad ayaa dhacday. Fadlan mar kale isku day.');
    } finally {
      setIsVerifying(false);
    }
  };

  const proceedToFaceCheck = () => {
    if (faceStatus === 'not_enrolled') {
      setScannerMode('enroll');
      setShowFaceScanner(true);
    } else {
      setIsSudoVerified(true);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying2FA(true);
    setSudoError('');
    try {
      const res = await fetch('/api/admin/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFACode }),
      });
      const data = await res.json();
      if (data.success) {
        setShow2FAInput(false);
        proceedToFaceCheck();
      } else {
        setSudoError(data.error || 'Invalid 2FA code');
      }
    } catch (err) {
      setSudoError('Cillad ayaa dhacday.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  if (status === 'loading' || faceStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1623]">
        <RevloLoader />
      </div>
    );
  }

  if (isSudoVerified) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0F1623] p-4 relative overflow-hidden">
      {/* iOS 18 Ambient Background Blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Lock Reason Banner */}
        {isLocked && lockReason && (
          <div className={`mb-4 p-4 rounded-xl border text-center animate-fade-in ${
            lockReason === 'stranger'
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
          }`}>
            <p className="text-sm font-bold">
              {lockReason === 'stranger'
                ? '⚠️ Qof aan la aqoonsanin ayaa la helay! Dashboard-ka waa is-xiray.'
                : '🔒 Wajigaaga 5 ilbiriqsi la la\'aa. Fadlan dib isu xaqiiji.'}
            </p>
          </div>
        )}

        {showFaceScanner ? (
          <FaceScanner
            mode={scannerMode}
            onSuccess={handleFaceSuccess}
            onCancel={scannerMode === 'verify' ? () => setShowFaceScanner(false) : undefined}
            onError={(err) => setSudoError(err)}
          />
        ) : faceAttemptError ? (
          <div className="bg-white/5 dark:bg-[#151C2C]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 dark:border-gray-800 animate-fade-in text-center shadow-2xl">
            <div className="bg-red-500/20 text-red-500 p-5 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">Access Denied</h2>
            <p className="text-red-400 font-bold mb-8 text-sm border-b border-white/10 pb-6">
              {faceAttemptError}
            </p>

            <button
              onClick={() => { setFaceAttemptError(''); setShowFaceScanner(true); }}
              className="w-full bg-red-500 text-white py-4 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-red-600 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Dib u baar Wajiga
            </button>

            <button
              onClick={() => { setFaceAttemptError(''); setFaceStatus('not_enrolled'); }}
              className="mt-6 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors uppercase tracking-widest"
            >
              Use Password Instead
            </button>
          </div>
        ) : show2FAInput ? (
          <div className="bg-white/5 dark:bg-[#151C2C]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 dark:border-gray-800 animate-fade-in shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Shield size={32} />
              </div>
            </div>
            
            <h2 className="text-2xl font-black text-white text-center mb-2">2FA Verification</h2>
            <p className="text-center text-gray-400 font-medium mb-8 text-sm">
              Enter the 6-digit code from your Authenticator App.
            </p>

            <form onSubmit={handle2FAVerify} className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1 mb-2 block">2FA Code</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={twoFACode}
                    onChange={(e) => setTwoFACode(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-medium text-center tracking-widest text-lg"
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {sudoError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm font-medium">
                  <AlertTriangle size={16} />
                  <span>{sudoError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying2FA || twoFACode.length < 6}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white transition-all rounded-xl font-black uppercase tracking-widest text-sm flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isVerifying2FA ? <RevloLoader /> : 'Verify Code'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white/5 dark:bg-[#151C2C]/80 backdrop-blur-xl p-8 rounded-2xl border border-white/10 dark:border-gray-800 animate-fade-in-up shadow-2xl">
            <div className="text-center mb-8">
              <div className="bg-red-500/20 text-red-500 p-4 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Super Admin Gate</h2>
              <p className="text-gray-400 mt-2 text-sm font-medium">
                Gali furaha sirta ah si aad u gasho xarunta maamulka.
              </p>
            </div>

            <form onSubmit={handleSudoVerify} className="space-y-6">
              <div className="space-y-2">
                <div className="relative group">
                  <input
                    type="password"
                    value={sudoPassword}
                    onChange={(e) => setSudoPassword(e.target.value)}
                    className="w-full pl-4 pr-12 py-4 rounded-xl border border-white/10 bg-black/20 text-white focus:border-red-500 focus:bg-black/40 transition-all outline-none font-medium placeholder-gray-600"
                    placeholder="Sudo Password..."
                    autoFocus
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                    <Shield size={20} />
                  </div>
                </div>
              </div>

              {sudoError && (
                <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 flex items-center animate-shake">
                  <AlertTriangle size={16} className="mr-2 shrink-0" />
                  {sudoError}
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-4 bg-white text-black rounded-xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center disabled:opacity-70"
              >
                {isVerifying ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  'Authenticate'
                )}
              </button>

              {faceStatus === 'enrolled' && (
                <button
                  type="button"
                  onClick={() => { setShowFaceScanner(true); setScannerMode('verify'); }}
                  className="w-full py-3 text-blue-400 hover:text-blue-300 font-bold transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  Face ID Isticmaal
                </button>
              )}

              <button
                type="button"
                onClick={() => router.push('/shop/dashboard')}
                className="w-full py-3 text-gray-500 hover:text-gray-300 font-bold transition-colors text-xs uppercase tracking-widest"
              >
                Dib ugu noqo Shop
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
