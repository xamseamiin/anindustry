'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { Camera, RefreshCw, AlertCircle, CheckCircle, XCircle, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Smile, Eye, User } from 'lucide-react';

interface FaceScannerProps {
  mode: 'enroll' | 'verify';
  onSuccess: (descriptor: number[]) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

interface EnrollStep {
  id: string;
  label: string;
  instruction: string;
  icon: React.ReactNode;
  guideAnimation: string; // CSS class for the guide avatar animation
  done: boolean;
  descriptor: number[] | null;
}

export default function FaceScanner({ mode, onSuccess, onCancel, onError }: FaceScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);

  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [statusText, setStatusText] = useState('Loading AI Models...');
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Enrollment State ───
  const [enrollSteps, setEnrollSteps] = useState<EnrollStep[]>([
    { id: 'front', label: 'Hore u fiiri', instruction: 'Si toos ah kaamirada u fiiri', icon: <User size={28} />, guideAnimation: 'guide-front', done: false, descriptor: null },
    { id: 'up', label: 'Kor u eeg', instruction: 'Madaxaaga yar kor u qaad', icon: <ArrowUp size={28} />, guideAnimation: 'guide-up', done: false, descriptor: null },
    { id: 'down', label: 'Hoos u eeg', instruction: 'Madaxaaga yar hoos u dhig', icon: <ArrowDown size={28} />, guideAnimation: 'guide-down', done: false, descriptor: null },
    { id: 'left', label: 'Bidix u jeeso', instruction: 'Wajigaaga yar bidix u jeedi', icon: <ArrowLeft size={28} />, guideAnimation: 'guide-left', done: false, descriptor: null },
    { id: 'right', label: 'Midig u jeeso', instruction: 'Wajigaaga yar midig u jeedi', icon: <ArrowRight size={28} />, guideAnimation: 'guide-right', done: false, descriptor: null },
    { id: 'smile', label: 'Qosol', instruction: 'Hadda si fiican u qosol!', icon: <Smile size={28} />, guideAnimation: 'guide-smile', done: false, descriptor: null },
    { id: 'eyes', label: 'Indhaha dhaqdhaqaaji', instruction: 'Indhaha midig iyo bidix u dhaqdhaqaaji', icon: <Eye size={28} />, guideAnimation: 'guide-eyes', done: false, descriptor: null },
  ]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStepIndexRef = useRef(0);
  const [stepCaptured, setStepCaptured] = useState(false);
  const captureDelayRef = useRef<NodeJS.Timeout | null>(null);
  const stepTransitionRef = useRef(false);
  const [faceBox, setFaceBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);

  // ─── Load Models ───
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setIsModelLoaded(true);
        setStatusText('Starting Camera...');
      } catch (err: any) {
        const msg = 'Waa lagu guuldareystay in la soo dejiyo AI models.';
        setErrorMsg(msg);
        if (onError) onError(msg);
      }
    };
    loadModels();
    return () => {
      stopCamera();
      if (captureDelayRef.current) clearTimeout(captureDelayRef.current);
    };
  }, []);

  useEffect(() => {
    if (isModelLoaded) startCamera();
  }, [isModelLoaded]);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices) throw new Error('Browser ma taageerayo Kaamirada.');
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (devices.filter(d => d.kind === 'videoinput').length === 0) {
        throw { name: 'NotFoundError', message: 'Hardware camera not found' };
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err: any) {
      let msg = 'Fadlan oggolow in kaamirada la isticmaalo.';
      if (err.name === 'NotFoundError' || err.message?.includes('not found')) msg = 'Lama helin Kaamiro.';
      else if (err.name === 'NotReadableError') msg = 'Kaamirada waxaa isticmaalaya barnaamij kale.';
      else if (err.name === 'NotAllowedError') msg = 'Kaamirada waa la xiray. Fadlan ka ogolow Browser-ka.';
      setErrorMsg(msg);
      if (onError) onError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const handleVideoPlay = () => {
    setIsCameraActive(true);
    if (mode === 'enroll') {
      setStatusText(enrollSteps[0].instruction);
      scanIntervalRef.current = setInterval(scanFaceEnroll, 500);
    } else {
      setStatusText('Wajigaaga soo qabo...');
      scanIntervalRef.current = setInterval(scanFaceVerify, 500);
    }
  };

  // ════════════════════════════════
  // ═══ CROPPED FACE VIEW
  // ════════════════════════════════
  const drawCroppedFace = (box: faceapi.Box) => {
    if (!videoRef.current || !cropCanvasRef.current) return;
    const ctx = cropCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    // Expand the box to include ears (add 40% padding on each side)
    const padding = box.width * 0.45;
    const topPadding = box.height * 0.3;
    const bottomPadding = box.height * 0.15;

    const sx = Math.max(0, box.x - padding);
    const sy = Math.max(0, box.y - topPadding);
    const sw = Math.min(video.videoWidth - sx, box.width + padding * 2);
    const sh = Math.min(video.videoHeight - sy, box.height + topPadding + bottomPadding);

    const canvasSize = 200;
    cropCanvasRef.current.width = canvasSize;
    cropCanvasRef.current.height = canvasSize;

    // Mirror the crop (since video is mirrored)
    ctx.save();
    ctx.translate(canvasSize, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasSize, canvasSize);
    ctx.restore();
  };

  // ════════════════════════════════
  // ═══ ENROLLMENT SCANNING
  // ════════════════════════════════
  const scanFaceEnroll = async () => {
    if (!videoRef.current || !canvasRef.current || success || stepTransitionRef.current || stepCaptured) return;

    try {
      const detections = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        setFaceDetected(true);
        const box = detections.detection.box;
        setFaceBox({ x: box.x, y: box.y, width: box.width, height: box.height });
        drawCroppedFace(box);

        // Auto-capture after 1.5s of continuous face detection
        if (!captureDelayRef.current && !stepTransitionRef.current) {
          captureDelayRef.current = setTimeout(() => {
            captureStep(Array.from(detections.descriptor));
          }, 1500);
        }
      } else {
        setFaceDetected(false);
        setFaceBox(null);
        // Reset capture timer if face lost
        if (captureDelayRef.current) {
          clearTimeout(captureDelayRef.current);
          captureDelayRef.current = null;
        }
      }
    } catch (err) {
      console.error('Enroll scan error:', err);
    }
  };

  const captureStep = (descriptor: number[]) => {
    captureDelayRef.current = null;
    stepTransitionRef.current = true;
    setStepCaptured(true);

    const currentIndex = currentStepIndexRef.current;

    setEnrollSteps(prev => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], done: true, descriptor };
      return updated;
    });

    const nextIndex = currentIndex + 1;

    if (nextIndex >= enrollSteps.length) {
      // All done!
      setStatusText('Diiwaangelinta waa la dhammeeyay!');
      setSuccess(true);
      stopCamera();

      setTimeout(() => {
        setEnrollSteps(prev => {
          const allDescriptors = prev.map(s => s.descriptor!).filter(Boolean);
          const avgDescriptor = new Array(128).fill(0);
          for (const desc of allDescriptors) {
            for (let i = 0; i < 128; i++) avgDescriptor[i] += desc[i];
          }
          for (let i = 0; i < 128; i++) avgDescriptor[i] /= allDescriptors.length;
          onSuccess(avgDescriptor);
          return prev;
        });
      }, 1200);
    } else {
      // Show green confirmation, then move to next step
      setTimeout(() => {
        currentStepIndexRef.current = nextIndex;
        setCurrentStepIndex(nextIndex);
        
        setEnrollSteps(prev => {
           setStatusText(prev[nextIndex].instruction);
           return prev;
        });

        stepTransitionRef.current = false;
        setStepCaptured(false);
        setFaceDetected(false);
      }, 1500);
    }
  };

  // ════════════════════════════════
  // ═══ VERIFICATION SCANNING
  // ════════════════════════════════
  const scanFaceVerify = async () => {
    if (!videoRef.current || !canvasRef.current || success) return;

    try {
      const detections = await faceapi.detectSingleFace(
        videoRef.current,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.35 })
      ).withFaceLandmarks().withFaceDescriptor();

      if (detections) {
        setFaceDetected(true);
        const box = detections.detection.box;
        setFaceBox({ x: box.x, y: box.y, width: box.width, height: box.height });
        drawCroppedFace(box);

        setStatusText('Wajiga la baarayo...');
        const descriptorArray = Array.from(detections.descriptor);

        try {
          const res = await fetch('/api/admin/face-auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ liveDescriptor: descriptorArray })
          });
          const data = await res.json();
          if (data.success) {
            setSuccess(true);
            setStatusText('Wajiga waa la gartay!');
            stopCamera();
            onSuccess(descriptorArray);
          }
        } catch (err) { /* keep scanning */ }
      } else {
        setFaceDetected(false);
        setFaceBox(null);
        setStatusText('Wajigaaga soo qabo...');
      }
    } catch (err) {
      console.error('Verify scan error:', err);
    }
  };

  // ════════════════════════════════
  // ═══ RENDER
  // ════════════════════════════════
  const currentStep = enrollSteps[currentStepIndex];
  const completedCount = enrollSteps.filter(s => s.done).length;
  const progressPercent = (completedCount / enrollSteps.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto">
      {/* Inline Styles for Guide Animations */}
      <style jsx global>{`
        @keyframes guide-front { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes guide-up { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes guide-down { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(8px); } }
        @keyframes guide-left { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-10px); } }
        @keyframes guide-right { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }
        @keyframes guide-smile { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1) rotate(2deg); } }
        @keyframes guide-eyes { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .guide-front { animation: guide-front 2s ease-in-out infinite; }
        .guide-up { animation: guide-up 1.5s ease-in-out infinite; }
        .guide-down { animation: guide-down 1.5s ease-in-out infinite; }
        .guide-left { animation: guide-left 1.5s ease-in-out infinite; }
        .guide-right { animation: guide-right 1.5s ease-in-out infinite; }
        .guide-smile { animation: guide-smile 1.5s ease-in-out infinite; }
        .guide-eyes { animation: guide-eyes 1.2s ease-in-out infinite; }
        @keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.5; } 50% { transform: scale(1.05); opacity: 0; } 100% { transform: scale(0.95); opacity: 0.5; } }
        .pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
        @keyframes scan-line { 0% { top: 0; } 100% { top: calc(100% - 2px); } }
        .scan-line { animation: scan-line 2s ease-in-out infinite alternate; }
      `}</style>

      <div className="w-full p-5 rounded-2xl border shadow-2xl bg-gradient-to-b from-[#0a1628] to-[#0f1d35] border-emerald-500/10">

        {/* ─── Header ─── */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-black text-white tracking-tight">
            {mode === 'enroll' ? 'Face ID Diiwaangelin' : 'Face ID Xaqiijin'}
          </h3>
          <p className="text-gray-400 mt-1 text-xs font-medium">{statusText}</p>
        </div>

        {/* ─── Enrollment Progress Bar ─── */}
        {mode === 'enroll' && (
          <div className="mb-4">
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-bold text-gray-500">{completedCount} / {enrollSteps.length} dhammaystiran</span>
              <span className="text-[10px] font-bold text-emerald-400">{Math.round(progressPercent)}%</span>
            </div>
          </div>
        )}

        {!errorMsg ? (
          <>
            {/* ─── Main View: Split Layout ─── */}
            <div className={`grid gap-3 mb-4 ${mode === 'enroll' ? 'grid-cols-5' : 'grid-cols-1'}`}>

              {/* Guide Panel (Enrollment Only) */}
              {mode === 'enroll' && (
                <div className="col-span-2 flex flex-col items-center justify-center bg-white/[0.03] rounded-xl border border-white/5 p-3">
                  {/* Animated Guide Avatar */}
                  <div className={`relative mb-3 ${stepCaptured ? '' : (currentStep?.guideAnimation || '')}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
                      stepCaptured
                        ? 'bg-emerald-500/30 text-emerald-400 ring-4 ring-emerald-500/50'
                        : faceDetected
                        ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/30'
                        : 'bg-white/5 text-gray-500'
                    }`}>
                      {stepCaptured ? (
                        <CheckCircle size={36} className="text-emerald-400" />
                      ) : (
                        currentStep?.icon
                      )}
                    </div>
                    {/* Pulse ring when detecting */}
                    {faceDetected && !stepCaptured && (
                      <div className="absolute inset-0 rounded-full border-2 border-blue-400/50 pulse-ring" />
                    )}
                  </div>

                  {/* Step Instruction */}
                  <p className={`text-center font-bold text-sm transition-colors duration-300 ${
                    stepCaptured ? 'text-emerald-400' : 'text-white'
                  }`}>
                    {stepCaptured ? 'Waa la qabay! ✓' : currentStep?.label}
                  </p>
                  <p className="text-[10px] text-gray-500 text-center mt-1 font-medium">
                    {stepCaptured ? 'Kan xiga...' : currentStep?.instruction}
                  </p>

                  {/* Step Dots */}
                  <div className="flex gap-1.5 mt-3">
                    {enrollSteps.map((step, i) => (
                      <div
                        key={step.id}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          step.done
                            ? 'bg-emerald-500'
                            : i === currentStepIndex
                            ? 'bg-blue-400 scale-125'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Camera + Face Crop View */}
              <div className={`${mode === 'enroll' ? 'col-span-3' : 'col-span-1'} flex flex-col gap-3`}>
                {/* Cropped Face Circle */}
                <div className="flex justify-center">
                  <div className={`relative w-40 h-40 rounded-full overflow-hidden transition-all duration-500 ${
                    success
                      ? 'ring-4 ring-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                      : stepCaptured
                      ? 'ring-4 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : faceDetected
                      ? 'ring-3 ring-blue-500/60 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      : 'ring-2 ring-white/10'
                  }`}>
                    {/* Crop Canvas */}
                    <canvas
                      ref={cropCanvasRef}
                      className={`w-full h-full object-cover ${faceDetected || success ? 'opacity-100' : 'opacity-30'}`}
                    />

                    {/* No Face Placeholder */}
                    {!faceDetected && !success && isCameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/5">
                        <User size={48} className="text-gray-600" />
                      </div>
                    )}

                    {/* Success Overlay */}
                    {success && (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/80 backdrop-blur-sm">
                        <CheckCircle size={48} className="text-white" />
                      </div>
                    )}

                    {/* Scanning Line */}
                    {faceDetected && !stepCaptured && !success && (
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent scan-line" />
                    )}
                  </div>
                </div>

                {/* Hidden Video (raw feed) */}
                <div className="relative w-full aspect-[4/3] bg-black/50 rounded-xl overflow-hidden">
                  {!isCameraActive && !success && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white z-10">
                      <RefreshCw className="animate-spin mb-2" size={20} />
                      <span className="text-xs font-medium">Kaamirada la diyaarinayaa...</span>
                    </div>
                  )}

                  <video
                    ref={videoRef}
                    onPlay={handleVideoPlay}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full hidden"
                  />

                  {/* Face Detection Indicator */}
                  <div className={`absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    faceDetected
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${faceDetected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {faceDetected ? 'Wajiga la helay' : 'La raadinayaa...'}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Completed Steps List (Enrollment) ─── */}
            {mode === 'enroll' && completedCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {enrollSteps.filter(s => s.done).map(step => (
                  <div key={step.id} className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20">
                    <CheckCircle size={10} />
                    {step.label}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full flex flex-col items-center justify-center bg-red-500/10 text-red-100 p-6 rounded-xl text-center mb-4 border border-red-500/20">
            <AlertCircle size={36} className="mb-3 text-red-500" />
            <span className="font-bold text-sm mb-4">{errorMsg}</span>
            <button
              onClick={() => { setErrorMsg(''); startCamera(); }}
              className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <RefreshCw size={16} /> Isku Day Markale
            </button>
          </div>
        )}

        {/* Cancel Button */}
        {onCancel && !success && (
          <button
            onClick={() => { stopCamera(); onCancel(); }}
            className="w-full py-2.5 text-gray-500 hover:text-gray-300 font-bold transition-colors text-xs uppercase tracking-widest"
          >
            Ka noqo
          </button>
        )}
      </div>
    </div>
  );
}
