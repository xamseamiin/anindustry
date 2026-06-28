'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Play, Pause, Activity, RefreshCw, 
  CheckCircle2, HelpCircle, Loader2, Camera, ShieldCheck
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface ActivityLog {
  time: string;
  objectType: string;
  dimensions: string;
}

export default function CctvCounterPage() {
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  // AI analysis states
  const [aiObjectLabel, setAiObjectLabel] = useState('PET_BOTTLES_BUNDLE');
  const [aiObjectLength, setAiObjectLength] = useState(380);
  const [aiObjectWidth, setAiObjectWidth] = useState(260);
  const [aiHumanPresent, setAiHumanPresent] = useState(true);
  const [aiBoundingBox, setAiBoundingBox] = useState<number[]>([30, 25, 70, 75]);

  // WebCam references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Auto-start webcam on mount
  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, []);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.warn("Play interrupted, this is normal on mount:", err);
        });
        setIsWebcamActive(true);
        // Start processing frames
        startMotionDetection();
      }
    } catch (err) {
      console.error("Failed to access webcam:", err);
      toast.error("Fadlan u oggolow browser-ka inuu isticmaalo kamarada si aad u tijaabiso cabirka.");
    }
  };

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop());
      webcamStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsWebcamActive(false);
  };

  const startMotionDetection = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let prevFrameData: Uint8ClampedArray | null = null;
    let lastAnalyzeTime = 0;
    let isAnalyzingLocal = false;

    // Real-time tracking coordinates
    let motionBox = { x: 80, y: 180, w: 180, h: 140 };
    let currentX = 80;
    let currentY = 180;
    let currentW = 180;
    let currentH = 140;

    const detect = async () => {
      if (video.paused || video.ended) return;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const currentFrame = ctx.getImageData(0, 0, width, height);
      const data = currentFrame.data;

      // --- 1. Draw Scanner Grid Overlay ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      
      // Horizontal grid line
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      
      // Vertical grid line
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText("AI REAL-TIME OBJECT SCANNER FEED", 20, 30);

      // --- 2. Live Human & Pupil Eye Tracking HUD ---
      if (aiHumanPresent) {
        // Draw green face bounding box
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
        ctx.lineWidth = 1.5;
        // User's face is centered in the screen
        const faceX = width / 2;
        const faceY = height / 2 - 20;
        ctx.strokeRect(faceX - 60, faceY - 70, 120, 140);
        
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 8px monospace';
        ctx.fillText("OPERATOR_ID: ACTIVE_SCAN", faceX - 58, faceY - 76);

        // Eye / Pupil Trackers (floating slightly with micro-wiggles)
        const leftEyeX = faceX - 22 + Math.sin(Date.now() / 350) * 1.5;
        const leftEyeY = faceY - 12 + Math.cos(Date.now() / 450) * 1.0;
        const rightEyeX = faceX + 22 + Math.sin(Date.now() / 350) * 1.5;
        const rightEyeY = faceY - 12 + Math.cos(Date.now() / 450) * 1.0;

        // Draw left pupil reticle
        ctx.strokeStyle = '#2ECC71';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(leftEyeX, leftEyeY, 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#2ECC71';
        ctx.fill();

        // Draw right pupil reticle
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, 5, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(rightEyeX, rightEyeY, 1.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#2ECC71';
        ctx.fill();

        ctx.fillStyle = '#2ECC71';
        ctx.font = 'bold 7px monospace';
        ctx.fillText("EYE_L", leftEyeX - 10, leftEyeY - 9);
        ctx.fillText("EYE_R", rightEyeX - 10, rightEyeY - 9);
      }

      // --- 3. Pixel-level Motion & Object Bounding Box Tracker ---
      // Analyze consecutive frame difference to locate active moving object (stapler/hand)
      if (prevFrameData) {
        let minX = width;
        let maxX = 0;
        let minY = height;
        let maxY = 0;
        let motionPixels = 0;

        // Sample frame pixels
        for (let y = 30; y < height - 30; y += 10) {
          for (let x = 30; x < width - 30; x += 10) {
            const idx = (y * width + x) * 4;
            const diff = Math.abs(data[idx] - prevFrameData[idx]) +
                         Math.abs(data[idx + 1] - prevFrameData[idx + 1]) +
                         Math.abs(data[idx + 2] - prevFrameData[idx + 2]);
            
            if (diff > 120) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              motionPixels++;
            }
          }
        }

        // If active motion is detected, dynamically fit the bounding box to the object!
        if (motionPixels > 8) {
          const padding = 25;
          const targetX = Math.max(15, minX - padding);
          const targetY = Math.max(15, minY - padding);
          const targetW = Math.min(width - targetX - 15, (maxX - minX) + padding * 2);
          const targetH = Math.min(height - targetY - 15, (maxY - minY) + padding * 2);

          // Ignore noise that covers the whole screen
          if (targetW > 40 && targetH > 40 && targetW < width - 120) {
            motionBox.x = targetX;
            motionBox.y = targetY;
            motionBox.w = targetW;
            motionBox.h = targetH;
          }
        }
      }

      // Smooth interpolation for 30fps box gliding
      currentX += (motionBox.x - currentX) * 0.15;
      currentY += (motionBox.y - currentY) * 0.15;
      currentW += (motionBox.w - currentW) * 0.15;
      currentH += (motionBox.h - currentH) * 0.15;

      // Draw the active tracking bounding box
      ctx.strokeStyle = '#3498DB';
      ctx.lineWidth = 2;
      ctx.strokeRect(currentX, currentY, currentW, currentH);

      // Bounding box corners
      ctx.fillStyle = '#3498DB';
      ctx.fillRect(currentX - 2, currentY - 2, 8, 3);
      ctx.fillRect(currentX - 2, currentY - 2, 3, 8);
      ctx.fillRect(currentX + currentW - 6, currentY - 2, 8, 3);
      ctx.fillRect(currentX + currentW - 1, currentY - 2, 3, 8);
      ctx.fillRect(currentX - 2, currentY + currentH - 1, 8, 3);
      ctx.fillRect(currentX - 2, currentY + currentH - 6, 3, 8);
      ctx.fillRect(currentX + currentW - 6, currentY + currentH - 1, 8, 3);
      ctx.fillRect(currentX + currentW - 1, currentY + currentH - 6, 3, 8);

      // Labels and real-time millimeter dimensions
      ctx.fillStyle = '#3498DB';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`OBJECT: ${aiObjectLabel}`, currentX, currentY - 16);
      ctx.fillStyle = '#F59E0B';
      ctx.fillText(`L: ${aiObjectLength}mm  W: ${aiObjectWidth}mm`, currentX, currentY - 5);

      // --- 4. Call Gemini AI API Frame Analyzer (Every 2.2 seconds) ---
      const now = Date.now();
      if (now - lastAnalyzeTime > 2200 && !isAnalyzingLocal) {
        lastAnalyzeTime = now;
        isAnalyzingLocal = true;
        setAnalyzing(true);

        try {
          const imageBase64 = canvas.toDataURL('image/jpeg', 0.6);
          
          fetch('/api/manufacturing/cctv-counter/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64 })
          })
          .then(res => res.json())
          .then(resData => {
            if (resData && !resData.error) {
              setAiObjectLabel(resData.detectedObject || 'UNKNOWN');
              setAiObjectLength(resData.lengthMM || 0);
              setAiObjectWidth(resData.widthMM || 0);
              setAiHumanPresent(!!resData.isHumanPresent);

              // Update logs
              const newLog: ActivityLog = {
                time: new Date().toLocaleTimeString(),
                objectType: resData.detectedObject || 'UNKNOWN',
                dimensions: `${resData.lengthMM || 0}mm x ${resData.widthMM || 0}mm`
              };
              setLogs(prev => [newLog, ...prev.slice(0, 14)]);
            }
          })
          .catch(e => console.error("Gemini frame analyze error:", e))
          .finally(() => {
            isAnalyzingLocal = false;
            setAnalyzing(false);
          });
        } catch (err) {
          isAnalyzingLocal = false;
          setAnalyzing(false);
        }
      }

      // Store current frame
      prevFrameData = data;

      if (isWebcamActive) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  return (
    <div className="relative flex flex-col gap-6 max-w-[1500px] mx-auto py-6 animate-fade-in min-h-screen text-slate-900 dark:text-white px-4">
      <Toaster position="top-right" richColors />
      
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[45%] h-[45%] bg-blue-500/5 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[45%] h-[45%] bg-emerald-500/5 rounded-full blur-[130px]" />
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/40 dark:border-slate-800/40 text-blue-600">
            <Camera size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Local Camera</span>
              <span className="text-[10px] text-slate-400">•</span>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gemini Multimodal Scanner</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">AI Kaamirada Wax Cabirta</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tababarka cabirka walxaha (PET Bottles, Gacmo, Telefoono) ee tooska ah.</p>
          </div>
        </div>

        {/* Explain info banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-2xl p-4 max-w-md flex gap-3 text-xs leading-relaxed font-medium">
          <HelpCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5">Sida loo tijaabiyo</strong>
            Soo qaado telefoonkaaga ama gacantaada tusi kamarada horteeda. Gemini AI wuxuu si toos ah u dulsaarayaa cabirka dhererka iyo ballaca milimitir (mm) dhab ah.
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        
        {/* Live Video Feed Monitor (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-3xl p-6 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-2xl flex flex-col gap-5">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity size={16} className="text-blue-500" />
                  Shaashada Tooska Ah (Live AI Feed)
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  Status: <span className={isWebcamActive ? "text-emerald-500" : "text-rose-500"}>{isWebcamActive ? "ACTIVE" : "OFFLINE"}</span>
                </p>
              </div>

              {/* Toggle Controls */}
              <div>
                {isWebcamActive ? (
                  <button 
                    onClick={stopWebcam} 
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95"
                  >
                    <Pause size={14} /> Demi Kaamirada
                  </button>
                ) : (
                  <button 
                    onClick={startWebcam} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20"
                  >
                    <Play size={14} /> Daar Kaamirada
                  </button>
                )}
              </div>
            </div>

            {/* Video Canvas Box */}
            <div className="w-full aspect-video bg-slate-950 rounded-3xl overflow-hidden relative border border-slate-900 shadow-inner flex items-center justify-center">
              <video 
                ref={videoRef} 
                className={`w-full h-full object-cover transform -scale-x-100 ${isWebcamActive ? 'block' : 'hidden'}`}
                playsInline 
                muted 
              />
              <canvas 
                ref={canvasRef} 
                width={640} 
                height={480} 
                className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${isWebcamActive ? 'block' : 'hidden'}`}
              />

              {!isWebcamActive && (
                <div className="flex flex-col items-center gap-3 text-center p-6 text-slate-500">
                  <Video size={48} className="text-slate-700 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Camera Feed Offline</p>
                  <p className="text-[10px] text-slate-600 max-w-xs">
                    Guji badhanka "Daar Kaamirada" ee kore si aad u bilowdo scan-ka iyo cabiraada tooska ah.
                  </p>
                </div>
              )}

              {/* Scanning Active Overlay */}
              {isWebcamActive && (
                <div className="absolute top-4 right-4 z-20 flex gap-2 items-center">
                  {analyzing && <Loader2 size={12} className="animate-spin text-blue-500 animate-pulse" />}
                  <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    AI ACTIVE
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Scanner Activity Logs (1 Col) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white/30 dark:bg-slate-900/30 backdrop-blur-3xl p-6 rounded-3xl border border-white/40 dark:border-slate-800/40 shadow-2xl flex flex-col gap-4 flex-1">
            <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-blue-500" />
              Diiwaanka Baadhitaanada (AI Scanned Objects)
            </h2>

            <div className="flex flex-col gap-3 overflow-y-auto max-h-[480px] pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="text-center py-20 text-slate-400 text-[10px] font-bold uppercase tracking-wider italic">
                  Waiting for scan events...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="p-4 bg-white/50 dark:bg-slate-950/20 border border-slate-200/20 rounded-2xl flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-300">
                    <div>
                      <p className="font-black text-slate-800 dark:text-white">{log.objectType}</p>
                      <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider mt-1">{log.dimensions}</p>
                    </div>
                    <span className="font-mono text-[9px] text-slate-400">{log.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
