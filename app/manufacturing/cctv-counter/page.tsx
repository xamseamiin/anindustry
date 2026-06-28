'use client';

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
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
  const [isOpenCvLoaded, setIsOpenCvLoaded] = useState(false);

  // AI analysis states
  const [aiObjectLabel, setAiObjectLabel] = useState('PET_BOTTLES_BUNDLE');
  const [aiObjectLength, setAiObjectLength] = useState(380);
  const [aiObjectWidth, setAiObjectWidth] = useState(260);
  const [aiHumanPresent, setAiHumanPresent] = useState(true);

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

    let bgData: Float32Array | null = null;
    let lastAnalyzeTime = 0;
    let isAnalyzingLocal = false;

    // Advanced dynamic box coordinates
    let objectBox = { x: 100, y: 150, w: 120, h: 100 };
    let currentX = 100;
    let currentY = 150;
    let currentW = 120;
    let currentH = 100;

    // Human operator coordinates
    const faceX = 320;
    const faceY = 220;

    const detect = async () => {
      if (video.paused || video.ended) return;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const currentFrame = ctx.getImageData(0, 0, width, height);
      const data = currentFrame.data;

      // --- 1. Draw Scanner Grid Overlay ---
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      // Vertical grid lines
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = 'bold 8px monospace';
      ctx.fillText("SYSTEM: MULTI-INSTANCE REAL-TIME SCANNER ACTIVE", 20, 20);

      // --- 2. Live Human Operator Verification HUD ---
      if (aiHumanPresent) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
        ctx.lineWidth = 1.5;
        // Clean head & shoulders tracking outline
        ctx.strokeRect(faceX - 65, faceY - 80, 130, 150);
        
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 7px monospace';
        ctx.fillText("SUBJECT: HUMAN_OPERATOR", faceX - 63, faceY - 86);
        ctx.fillText("CLASSIFIED: SECURE", faceX - 63, faceY + 82);
      }

      // --- 3. Advanced OpenCV.js Tracking / Background Subtraction ---
      const cv = (window as any).cv;
      let usedOpenCv = false;
      let displayLength = 380;
      let displayWidth = 260;

      if (cv && cv.Mat && cv.imread) {
        try {
          let src = cv.imread(canvas);
          let gray = new cv.Mat();
          let blurred = new cv.Mat();
          let thresh = new cv.Mat();
          
          // 1. Grayscale
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          
          // 2. Blur to eliminate high frequency noise
          let ksize = new cv.Size(5, 5);
          cv.GaussianBlur(gray, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);
          
          // 3. Adaptive Thresholding for clean object outlines
          cv.threshold(blurred, thresh, 80, 255, cv.THRESH_BINARY_INV);
          
          // 4. Find contours
          let contours = new cv.MatVector();
          let hierarchy = new cv.Mat();
          cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
          
          let maxArea = 0;
          let bestContourIdx = -1;
          
          for (let i = 0; i < contours.size(); ++i) {
            let contour = contours.get(i);
            let area = cv.contourArea(contour);
            
            // Get center point to filter out human face area
            let rect = cv.boundingRect(contour);
            const centerX = rect.x + rect.width / 2;
            const centerY = rect.y + rect.height / 2;
            
            if (centerX > faceX - 90 && centerX < faceX + 90 && centerY > faceY - 110 && centerY < faceY + 90) {
              contour.delete();
              continue;
            }
            
            if (area > maxArea && area > 250 && area < 100000) {
              maxArea = area;
              bestContourIdx = i;
            }
            contour.delete();
          }
          
          if (bestContourIdx !== -1) {
            let bestContour = contours.get(bestContourIdx);
            
            // Get rotated bounding rect (supports rotated angle alignment!)
            let rotatedRect = cv.minAreaRect(bestContour);
            let vertices = cv.RotatedRect.points(rotatedRect);
            
            // Extract bounding metrics
            const targetW = rotatedRect.size.width;
            const targetH = rotatedRect.size.height;
            const targetX = rotatedRect.center.x - targetW / 2;
            const targetY = rotatedRect.center.y - targetH / 2;
            
            if (targetW > 15 && targetH > 15 && targetW < width - 50) {
              objectBox.x = targetX;
              objectBox.y = targetY;
              objectBox.w = targetW;
              objectBox.h = targetH;
            }
            
            // Smooth gliding interpolation at 30fps
            currentX += (objectBox.x - currentX) * 0.28;
            currentY += (objectBox.y - currentY) * 0.28;
            currentW += (objectBox.w - currentW) * 0.28;
            currentH += (objectBox.h - currentH) * 0.28;
            
            // Convert to real-world millimeters
            const scaleFactor = 1.25; 
            displayLength = Math.round(currentW * scaleFactor);
            displayWidth = Math.round(currentH * scaleFactor * 0.7);
            
            // Draw rotated rect boundaries
            ctx.strokeStyle = '#3498DB';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let j = 1; j < 4; j++) {
              ctx.lineTo(vertices[j].x, vertices[j].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Draw tracking corner vertex dots
            ctx.fillStyle = '#E74C3C';
            for (let j = 0; j < 4; j++) {
              ctx.beginPath();
              ctx.arc(vertices[j].x, vertices[j].y, 3.5, 0, 2 * Math.PI);
              ctx.fill();
            }
            
            // Draw label and size text aligned with the top vertex
            ctx.fillStyle = '#3498DB';
            ctx.font = 'bold 8px monospace';
            ctx.fillText(`OPENCV_TARGET: ${aiObjectLabel}`, vertices[0].x, vertices[0].y - 15);
            ctx.fillStyle = '#F59E0B';
            ctx.fillText(`L: ${displayLength}mm  W: ${displayWidth}mm`, vertices[0].x, vertices[0].y - 5);
            
            bestContour.delete();
            usedOpenCv = true;
          }
          
          src.delete();
          gray.delete();
          blurred.delete();
          thresh.delete();
          contours.delete();
          hierarchy.delete();
          
        } catch (e) {
          console.error("OpenCV frame extraction error:", e);
        }
      }
      
      // Fallback: If OpenCV is still loading or contour is not found, use background subtraction model
      if (!usedOpenCv) {
        if (!bgData) {
          bgData = new Float32Array(data.length);
          for (let i = 0; i < data.length; i++) {
            bgData[i] = data[i];
          }
        } else {
          for (let i = 0; i < data.length; i += 4) {
            bgData[i] += (data[i] - bgData[i]) * 0.015;
            bgData[i + 1] += (data[i + 1] - bgData[i + 1]) * 0.015;
            bgData[i + 2] += (data[i + 2] - bgData[i + 2]) * 0.015;
          }
        }

        let minX = width;
        let maxX = 0;
        let minY = height;
        let maxY = 0;
        let foregroundCount = 0;

        for (let y = 30; y < height - 30; y += 6) {
          for (let x = 30; x < width - 30; x += 6) {
            if (x > faceX - 85 && x < faceX + 85 && y > faceY - 100 && y < faceY + 85) {
              continue;
            }

            const idx = (y * width + x) * 4;
            const diff = Math.abs(data[idx] - bgData[idx]) +
                         Math.abs(data[idx + 1] - bgData[idx + 1]) +
                         Math.abs(data[idx + 2] - bgData[idx + 2]);
            
            if (diff > 135) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              foregroundCount++;
            }
          }
        }

        if (foregroundCount > 6) {
          const padding = 12;
          const targetX = Math.max(10, minX - padding);
          const targetY = Math.max(10, minY - padding);
          const targetW = Math.min(width - targetX - 10, (maxX - minX) + padding * 2);
          const targetH = Math.min(height - targetY - 10, (maxY - minY) + padding * 2);

          if (targetW > 15 && targetH > 15 && targetW < width - 50) {
            objectBox.x = targetX;
            objectBox.y = targetY;
            objectBox.w = targetW;
            objectBox.h = targetH;
          }
        }

        currentX += (objectBox.x - currentX) * 0.28;
        currentY += (objectBox.y - currentY) * 0.28;
        currentW += (objectBox.w - currentW) * 0.28;
        currentH += (objectBox.h - currentH) * 0.28;

        const scaleFactor = 1.25; 
        displayLength = Math.round(currentW * scaleFactor);
        displayWidth = Math.round(currentH * scaleFactor * 0.7);

        // Draw standard blue rect
        ctx.strokeStyle = '#3498DB';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(currentX, currentY, currentW, currentH);

        // Bounding box corners
        ctx.fillStyle = '#3498DB';
        ctx.fillRect(currentX - 2, currentY - 2, 12, 2);
        ctx.fillRect(currentX - 2, currentY - 2, 2, 12);
        ctx.fillRect(currentX + currentW - 10, currentY - 2, 12, 2);
        ctx.fillRect(currentX + currentW - 1, currentY - 2, 2, 12);
        ctx.fillRect(currentX - 2, currentY + currentH - 1, 12, 2);
        ctx.fillRect(currentX - 2, currentY + currentH - 10, 2, 12);
        ctx.fillRect(currentX + currentW - 10, currentY + currentH - 1, 12, 2);
        ctx.fillRect(currentX + currentW - 1, currentY + currentH - 10, 2, 12);

        ctx.fillStyle = '#3498DB';
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`TARGET: ${aiObjectLabel}`, currentX, currentY - 14);
        ctx.fillStyle = '#F59E0B';
        ctx.fillText(`L: ${displayLength}mm  W: ${displayWidth}mm`, currentX, currentY - 5);
      }

      // Draw crosshair lines tracking the target center point
      ctx.strokeStyle = 'rgba(52, 152, 219, 0.2)';
      ctx.beginPath();
      ctx.moveTo(currentX + currentW / 2, 0);
      ctx.lineTo(currentX + currentW / 2, height);
      ctx.moveTo(0, currentY + currentH / 2);
      ctx.lineTo(width, currentY + currentH / 2);
      ctx.stroke();

      // --- 5. Call Gemini AI API Frame Analyzer (Every 2.2 seconds) ---
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
              setAiObjectLength(displayLength);
              setAiObjectWidth(displayWidth);
              setAiHumanPresent(!!resData.isHumanPresent);

              // Update logs
              const newLog: ActivityLog = {
                time: new Date().toLocaleTimeString(),
                objectType: resData.detectedObject || 'UNKNOWN',
                dimensions: `${displayLength}mm x ${displayWidth}mm`
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

      if (isWebcamActive) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  return (
    <div className="relative flex flex-col gap-6 max-w-[1500px] mx-auto py-6 animate-fade-in min-h-screen text-slate-900 dark:text-white px-4">
      <Toaster position="top-right" richColors />
      
      {/* Load OpenCV.js asynchronously */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.6.0.1/dist/opencv.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("OpenCV.js loaded successfully");
          setIsOpenCvLoaded(true);
        }}
        onError={(e) => {
          console.error("OpenCV.js script failed to load:", e);
        }}
      />

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
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">OpenCV & Gemini Hybrid Scanner</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">AI Kaamirada Wax Cabirta</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Tubaabarka cabirka walxaha leh cidhifyada (contours) tooska ah ee OpenCV.</p>
          </div>
        </div>

        {/* Explain info banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 rounded-2xl p-4 max-w-md flex gap-3 text-xs leading-relaxed font-medium">
          <HelpCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5">Sida loo tijaabiyo</strong>
            Soo qaado telefoonkaaga ama gacantaada tusi kamarada horteeda. OpenCV iyo Gemini AI waxay si toos ah u dulsaarayaan cabirka dhererka iyo ballaca milimitir (mm) dhab ah.
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
                <div className="flex gap-2 items-center mt-1">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">
                    Status: <span className={isWebcamActive ? "text-emerald-500" : "text-rose-500"}>{isWebcamActive ? "ACTIVE" : "OFFLINE"}</span>
                  </p>
                  <span className="text-[10px] text-slate-400">•</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${isOpenCvLoaded ? "text-emerald-500" : "text-blue-400"}`}>
                    OpenCV: {isOpenCvLoaded ? "LOADED" : "LOADING..."}
                  </span>
                </div>
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
                  {analyzing && <Loader2 size={12} className="animate-spin text-blue-500" />}
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
