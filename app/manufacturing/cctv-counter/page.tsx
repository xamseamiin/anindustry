'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Camera, Play, Pause, Save, Trash2, RefreshCw, 
  CheckCircle, AlertTriangle, AlertCircle, Info, Database,
  TrendingUp, Activity, Plus, Layers, ShieldCheck, HelpCircle,
  ChevronRight, Loader2, ArrowRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast, Toaster } from 'sonner';

const localTranslations = {
  so: {
    title: "Tiriyaha CCTV & Kaamirada AI",
    subtitle: "Maamul oo ku xidh kamaradaha CCTV nidaamka AI ee tirinaya baakadaha (50/100 xabo) ee soo galaya ama baxaya.",
    deviceWebcam: "Kaamirada Laptop-ka (Webcam)",
    rtspCctv: "RTSP CCTV Stream",
    configureCamera: "Habaynta Kaamirada",
    cameraName: "Magaca Kaamirada",
    cameraUrl: "CCTV RTSP Stream URL",
    cameraUrlPlaceholder: "rtsp://username:password@ip:554/stream1",
    placement: "Goobta Cam-ka",
    entrance: "Irida Hore (Door Entrance)",
    exit: "Irida Danbe (Door Exit)",
    packSize: "Cabbirka Baakada",
    pcs50: "50 Xabo (Pcs)",
    pcs100: "100 Xabo (Pcs)",
    selectProduct: "Dooro Alaabta loo Shubayo (Inventory)",
    addCamera: "Ku Dar Kaamirada",
    cameraList: "Liiska Kaamiradaha",
    noCameras: "Ma jiraan kamarado la kaydiyay. Fadlan ku dar mid.",
    liveFeed: "Shaashada Tooska ah (Live AI Feed)",
    simulateFeed: "Simulate CCTV",
    openWebcam: "Daar Webcam-ka",
    closeWebcam: "Demi Webcam-ka",
    countingActive: "AI Tirinta waa Firfircoon tahay",
    inCount: "Gudaha (IN):",
    outCount: "Dibadda (OUT):",
    logsTitle: "Diiwaanka Dhaqdhaqaaqa (Live Counting Logs)",
    syncInventory: "U shub Kaydka Alaabta (Sync Inventory)",
    totalCounted: "Wadarta la Tiriyey",
    syncSuccess: "Kaydka alaabta si guul leh ayaa loo cusboonaysiiyay!",
    syncError: "Cilad ayaa dhacday inta lagu guda jiray cusboonaysiinta.",
    selectProductWarning: "Fadlan dooro alaabta aad rabto inaad u shubto kaydka.",
    motionAlert: "Dhaqdhaqaaq la ogaaday!",
    howItWorks: "Sida Nidaamku u shaqeeyo",
    howItWorksDesc: "Nidaamku wuxuu ogaadaa marka baakadu ka gudubto xariiqda calaamadsan ee shaashada. Waxaad isticmaali kartaa Webcam-kaaga si aad gacantaada ugu tijaabiso (ku kor rux xariiqda jaalaha ah)."
  },
  en: {
    title: "CCTV AI Counter System",
    subtitle: "Manage and connect CCTV cameras to the AI system to count plastic package bundles (50/100 pcs) entering or exiting.",
    deviceWebcam: "Local Device Webcam",
    rtspCctv: "RTSP CCTV Stream",
    configureCamera: "Configure Camera",
    cameraName: "Camera Name",
    cameraUrl: "CCTV RTSP Stream URL",
    cameraUrlPlaceholder: "rtsp://username:password@ip:554/stream1",
    placement: "Placement Location",
    entrance: "Entrance (Door IN)",
    exit: "Exit (Door OUT)",
    packSize: "Pack Bundle Size",
    pcs50: "50 Pieces (Pcs)",
    pcs100: "100 Pieces (Pcs)",
    selectProduct: "Link to Inventory Product",
    addCamera: "Add Camera Config",
    cameraList: "Configured Cameras",
    noCameras: "No cameras configured. Please configure one.",
    liveFeed: "Live AI Feed Monitor",
    simulateFeed: "Simulate CCTV",
    openWebcam: "Start Webcam",
    closeWebcam: "Stop Webcam",
    countingActive: "AI Counting Active",
    inCount: "IN Count:",
    outCount: "OUT Count:",
    logsTitle: "Live Activity Log",
    syncInventory: "Sync to Live Inventory",
    totalCounted: "Total Counted",
    syncSuccess: "Inventory stock successfully updated!",
    syncError: "Error updating inventory.",
    selectProductWarning: "Please select a product to update stock.",
    motionAlert: "Line crossing detected!",
    howItWorks: "How it works",
    howItWorksDesc: "The AI detects when a package crosses the yellow virtual line. You can start the Webcam and wave your hand over the yellow line to test the counting mechanism in real-time."
  }
};

interface CameraConfig {
  id: string;
  name: string;
  url: string;
  type: 'RTSP' | 'WEBCAM';
  placement: 'ENTRANCE' | 'EXIT';
  packSize: 50 | 100;
  linkedProductId: string;
}

interface ActivityLog {
  time: string;
  direction: 'IN' | 'OUT';
  packSize: number;
  count: number;
}

export default function CctvCounterPage() {
  const { language } = useLanguage();
  const tLocal = localTranslations[language as 'so' | 'en'] || localTranslations.so;

  // Camera Management States
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraConfig | null>(null);
  
  // Form States
  const [camName, setCamName] = useState('');
  const [camUrl, setCamUrl] = useState('');
  const [camType, setCamType] = useState<'RTSP' | 'WEBCAM'>('WEBCAM');
  const [camPlacement, setCamPlacement] = useState<'ENTRANCE' | 'EXIT'>('ENTRANCE');
  const [camPackSize, setCamPackSize] = useState<50 | 100>(50);
  const [camLinkedProduct, setCamLinkedProduct] = useState('');

  // Finished Goods list from backend
  const [products, setProducts] = useState<any[]>([]);

  // Counting States
  const [countIn, setCountIn] = useState(0);
  const [countOut, setCountOut] = useState(0);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // AI analysis states
  const [aiObjectLabel, setAiObjectLabel] = useState('PET_BOTTLES_BUNDLE');
  const [aiObjectLength, setAiObjectLength] = useState(380);
  const [aiObjectWidth, setAiObjectWidth] = useState(260);
  const [aiHumanPresent, setAiHumanPresent] = useState(true);
  const [aiBoundingBox, setAiBoundingBox] = useState<number[]>([30, 25, 70, 75]);

  // WebCam and motion detection references
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Load products & local cameras
  useEffect(() => {
    // 1. Fetch Finished Goods
    fetch('/api/manufacturing/inventory?category=Finished Goods')
      .then(res => res.json())
      .then(d => {
        setProducts(d.items || []);
      })
      .catch(err => console.error('Failed to load finished products:', err));

    // 2. Load configured cameras from localStorage
    const savedCams = localStorage.getItem('an_cctv_cameras');
    let loadedCams: CameraConfig[] = [];
    if (savedCams) {
      try {
        loadedCams = JSON.parse(savedCams);
      } catch (e) {
        console.error(e);
      }
    }
    
    if (loadedCams.length === 0) {
      loadedCams = [{
        id: 'default_webcam',
        name: 'Kaamirada Laptop-ka (Webcam)',
        url: 'Local Webcam',
        type: 'WEBCAM',
        placement: 'ENTRANCE',
        packSize: 50,
        linkedProductId: ''
      }];
      localStorage.setItem('an_cctv_cameras', JSON.stringify(loadedCams));
    }
    
    setCameras(loadedCams);
    setSelectedCamera(loadedCams[0]);
  }, []);

  // Autostart webcam on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      startWebcam();
    }, 600);
    return () => {
      stopWebcam();
    };
  }, []);

  // Sync cameras to localStorage
  const saveCameras = (newCams: CameraConfig[]) => {
    setCameras(newCams);
    localStorage.setItem('an_cctv_cameras', JSON.stringify(newCams));
  };

  const handleAddCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!camName.trim()) return;

    const newCam: CameraConfig = {
      id: `cam_${Date.now()}`,
      name: camName,
      url: camType === 'WEBCAM' ? 'Local Webcam' : camUrl,
      type: camType,
      placement: camPlacement,
      packSize: camPackSize,
      linkedProductId: camLinkedProduct
    };

    const updated = [...cameras, newCam];
    saveCameras(updated);
    setSelectedCamera(newCam);

    // Reset Form
    setCamName('');
    setCamUrl('');
    toast.success(language === 'so' ? 'Kamarada waa la diiwangeliyay!' : 'Camera added successfully!');
  };

  const handleDeleteCamera = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = cameras.filter(c => c.id !== id);
    saveCameras(updated);
    if (selectedCamera?.id === id) {
      setSelectedCamera(updated.length > 0 ? updated[0] : null);
      stopWebcam();
      setIsSimulating(false);
    }
    toast.success(language === 'so' ? 'Kaamirada waa la tirtiray' : 'Camera deleted');
  };

  // --- WEBCAM MOTION DETECTION CORE ALGORITHM ---
  const startWebcam = async () => {
    setIsSimulating(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      webcamStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsWebcamActive(true);
        startMotionDetection();
      }
    } catch (err) {
      console.error("Failed to access webcam:", err);
      toast.error(language === 'so' ? "Lama furi karo kamarada" : "Could not open camera");
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
    let cooldown = false;
    let lastAnalyzeTime = 0;
    let analyzing = false;

    // Local coordinates cache for smooth animation transitions
    let currentX = 160;
    let currentY = 140;
    let currentW = 320;
    let currentH = 200;

    const detect = async () => {
      if (video.paused || video.ended) return;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const width = canvas.width;
      const height = canvas.height;
      const currentFrame = ctx.getImageData(0, 0, width, height);
      const data = currentFrame.data;

      // --- 1. Draw Live Scanning Crosshairs / Grid Overlay ---
      const lineY = Math.floor(height / 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      // Horizontal grid line
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();
      
      // Vertical grid line
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px monospace';
      ctx.fillText("AI OBJECT DIMENSION SCANNER FEED", 15, 25);

      // --- 2. Live Human Presence Detection HUD ---
      if (aiHumanPresent) {
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'; // green face/body verification bounds
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, width - 60, height - 80);
        
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 8px monospace';
        ctx.fillText("AI HUMAN OPERATOR ACTIVE & DETECTED", 40, 45);
      }

      // --- 3. Live Object Dimensions Scanner Bounding Box ---
      // Map relative boundingBox [ymin, xmin, ymax, xmax] (0-100) to actual canvas pixels
      const [ymin, xmin, ymax, xmax] = aiBoundingBox;
      const targetY = (ymin / 100) * height;
      const targetX = (xmin / 100) * width;
      const targetH = ((ymax - ymin) / 100) * height;
      const targetW = ((xmax - xmin) / 100) * width;

      // Smooth interpolation for fluid box movement on screen
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      currentW += (targetW - currentW) * 0.15;
      currentH += (targetH - currentH) * 0.15;

      ctx.strokeStyle = '#3498DB'; // Sky blue border for tracking object
      ctx.lineWidth = 2.5;
      ctx.strokeRect(currentX, currentY, currentW, currentH);

      // Draw bounding box corners
      ctx.fillStyle = '#3498DB';
      ctx.fillRect(currentX - 2, currentY - 2, 10, 3);
      ctx.fillRect(currentX - 2, currentY - 2, 3, 10);
      ctx.fillRect(currentX + currentW - 8, currentY - 2, 10, 3);
      ctx.fillRect(currentX + currentW - 1, currentY - 2, 3, 10);
      ctx.fillRect(currentX - 2, currentY + currentH - 1, 10, 3);
      ctx.fillRect(currentX - 2, currentY + currentH - 8, 3, 10);
      ctx.fillRect(currentX + currentW - 8, currentY + currentH - 1, 10, 3);
      ctx.fillRect(currentX + currentW - 1, currentY + currentH - 8, 3, 10);

      // Display dynamic labels and dimensions
      ctx.fillStyle = '#3498DB';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`OBJECT: ${aiObjectLabel}`, currentX, currentY - 18);
      ctx.fillStyle = '#F59E0B'; // yellow text
      ctx.fillText(`L: ${aiObjectLength}mm  W: ${aiObjectWidth}mm`, currentX, currentY - 6);

      // --- 4. Call Gemini AI API Frame Analyzer (Every 2.5 seconds) ---
      const now = Date.now();
      if (now - lastAnalyzeTime > 2500 && !analyzing) {
        lastAnalyzeTime = now;
        analyzing = true;

        try {
          // Convert current canvas frame to base64 JPEG image (60% quality for performance)
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
              if (resData.boundingBox && resData.boundingBox.length === 4) {
                setAiBoundingBox(resData.boundingBox);
              }
            }
          })
          .catch(e => console.error("Gemini frame analyze request failed:", e))
          .finally(() => {
            analyzing = false;
          });
        } catch (err) {
          console.error("Failed to capture base64 frame:", err);
          analyzing = false;
        }
      }

      // --- 5. Frame crossing calculation & trigger ---
      // If the bounding box center crosses the lineY, trigger count!
      const boxCenterY = currentY + currentH / 2;
      const boxCenterX = currentX + currentW / 2;
      
      // If object crosses the virtual line
      if (Math.abs(boxCenterY - lineY) < 25 && !cooldown && boxCenterX > 30 && boxCenterX < width - 30) {
        cooldown = true;
        
        const direction = (selectedCamera?.placement || 'ENTRANCE') === 'ENTRANCE' ? 'IN' : 'OUT';
        const pack = selectedCamera?.packSize || 50;

        if (direction === 'IN') {
          setCountIn(prev => prev + 1);
        } else {
          setCountOut(prev => prev + 1);
        }

        const newLog: ActivityLog = {
          time: new Date().toLocaleTimeString(),
          direction,
          packSize: pack,
          count: 1
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        toast.success(tLocal.motionAlert + ` (+1 Pack of ${pack}) [L:${aiObjectLength}mm, W:${aiObjectWidth}mm] - ${aiObjectLabel}`);

        // Visual flash indicator
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.fillRect(0, lineY - 30, width, 60);

        setTimeout(() => {
          cooldown = false;
        }, 2000);
      }

      // Keep animation looping
      if (isWebcamActive) {
        animationFrameRef.current = requestAnimationFrame(detect);
      }
    };

    detect();
  };

  // Clean up webcam on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [isWebcamActive]);

  // --- MOCK CCTV SIMULATION LOGIC ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      stopWebcam();
      interval = setInterval(() => {
        // Randomly trigger entry/exit to simulate AI scanner counting packs
        const direction = Math.random() > 0.4 ? 'IN' : 'OUT';
        const size = selectedCamera?.packSize || 50;

        if (direction === 'IN') {
          setCountIn(prev => prev + 1);
        } else {
          setCountOut(prev => prev + 1);
        }

        const newLog: ActivityLog = {
          time: new Date().toLocaleTimeString(),
          direction,
          packSize: size,
          count: 1
        };
        setLogs(prev => [newLog, ...prev.slice(0, 19)]);
        toast.info(`CCTV Sim: Package crossed line (${direction === 'IN' ? 'Entrance' : 'Exit'})`);
      }, 5000); // Trigger every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isSimulating, selectedCamera]);

  // --- SYNC TO DATABASE INVENTORY ---
  const handleSyncToInventory = async () => {
    const activeProductId = selectedCamera?.linkedProductId || camLinkedProduct;
    if (!activeProductId) {
      toast.warning(tLocal.selectProductWarning);
      return;
    }

    const totalInPacks = countIn;
    const totalOutPacks = countOut;
    const packSize = selectedCamera?.packSize || 50;

    if (totalInPacks === 0 && totalOutPacks === 0) {
      toast.error("Waxba lama tirin hadda. Tijaabi koodhka marka hore!");
      return;
    }

    setSyncing(true);

    try {
      // 1. Sync IN Packages
      if (totalInPacks > 0) {
        await fetch('/api/manufacturing/cctv-counter/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: activeProductId,
            quantity: totalInPacks,
            packSize,
            type: 'IN',
            cameraName: selectedCamera?.name || 'Local_Cam'
          })
        });
      }

      // 2. Sync OUT Packages
      if (totalOutPacks > 0) {
        await fetch('/api/manufacturing/cctv-counter/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: activeProductId,
            quantity: totalOutPacks,
            packSize,
            type: 'OUT',
            cameraName: selectedCamera?.name || 'Local_Cam'
          })
        });
      }

      toast.success(tLocal.syncSuccess);
      
      // Reset Counter after successful commit
      setCountIn(0);
      setCountOut(0);

    } catch (e) {
      console.error(e);
      toast.error(tLocal.syncError);
    } finally {
      setSyncing(false);
    }
  };

  // Chart Mock Data
  const chartData = [
    { hour: '08:00', in: 12, out: 4 },
    { hour: '10:00', in: 24, out: 15 },
    { hour: '12:00', in: 48, out: 30 },
    { hour: '14:00', in: countIn * 2 + 10, out: countOut * 2 + 5 },
    { hour: '16:00', in: countIn * 5 + 15, out: countOut * 5 + 10 },
  ];

  return (
    <div className="relative flex flex-col gap-6 max-w-[1700px] mx-auto py-6 animate-fade-in min-h-screen">
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
            <Video size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{tLocal.deviceWebcam}</span>
              <ChevronRight size={10} className="text-slate-400" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Scan</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{tLocal.title}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{tLocal.subtitle}</p>
          </div>
        </div>

        {/* Explain info banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 rounded-2xl p-4 max-w-md flex gap-3 text-xs leading-relaxed font-medium">
          <HelpCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block mb-0.5">{tLocal.howItWorks}</strong>
            {tLocal.howItWorksDesc}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left column: Configurations & Camera Register */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Add Camera Form */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-slate-800/50 shadow-2xl">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <Plus size={16} className="text-blue-500" />
              {tLocal.configureCamera}
            </h2>

            <form onSubmit={handleAddCamera} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">{tLocal.cameraName}</label>
                <input 
                  type="text" 
                  value={camName}
                  onChange={e => setCamName(e.target.value)}
                  placeholder="Door 1 Exit / Warehouse IN"
                  className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCamType('WEBCAM')}
                  className={`py-2 px-3 border rounded-xl text-xs font-black transition-all ${
                    camType === 'WEBCAM' 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/20'
                  }`}
                >
                  {tLocal.deviceWebcam}
                </button>
                <button
                  type="button"
                  onClick={() => setCamType('RTSP')}
                  className={`py-2 px-3 border rounded-xl text-xs font-black transition-all ${
                    camType === 'RTSP' 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-white/20'
                  }`}
                >
                  {tLocal.rtspCctv}
                </button>
              </div>

              {camType === 'RTSP' && (
                <div className="flex flex-col gap-1.5 animate-fade-in">
                  <label className="text-[10px] font-black uppercase text-slate-400">{tLocal.cameraUrl}</label>
                  <input 
                    type="text" 
                    value={camUrl}
                    onChange={e => setCamUrl(e.target.value)}
                    placeholder={tLocal.cameraUrlPlaceholder}
                    className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white font-mono"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">{tLocal.placement}</label>
                  <select
                    value={camPlacement}
                    onChange={e => setCamPlacement(e.target.value as any)}
                    className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="ENTRANCE">{tLocal.entrance}</option>
                    <option value="EXIT">{tLocal.exit}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">{tLocal.packSize}</label>
                  <select
                    value={camPackSize}
                    onChange={e => setCamPackSize(Number(e.target.value) as any)}
                    className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white font-bold"
                  >
                    <option value={50}>{tLocal.pcs50}</option>
                    <option value={100}>{tLocal.pcs100}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">{tLocal.selectProduct}</label>
                <select
                  value={camLinkedProduct}
                  onChange={e => setCamLinkedProduct(e.target.value)}
                  className="bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-blue-500 text-slate-900 dark:text-white font-bold"
                  required
                >
                  <option value="">-- select product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (In Stock: {p.inStock})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <Save size={16} />
                {tLocal.addCamera}
              </button>
            </form>

          </div>

          {/* Configured Camera List */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-slate-800/50 shadow-2xl flex-1">
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Layers size={16} className="text-blue-500" />
              {tLocal.cameraList}
            </h2>

            {cameras.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-medium">
                {tLocal.noCameras}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cameras.map(cam => {
                  const linkedProduct = products.find(p => p.id === cam.linkedProductId);
                  return (
                    <div 
                      key={cam.id} 
                      onClick={() => {
                        setSelectedCamera(cam);
                        stopWebcam();
                        setIsSimulating(false);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                        selectedCamera?.id === cam.id
                          ? 'bg-blue-500/10 border-blue-500 shadow-md shadow-blue-500/5'
                          : 'bg-white/50 dark:bg-slate-950/20 border-slate-200/40 dark:border-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-950/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${
                          selectedCamera?.id === cam.id ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          <Camera size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{cam.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                            {cam.placement} • {cam.packSize} Pcs Bundle
                          </p>
                          {linkedProduct && (
                            <p className="text-[9px] text-emerald-500 font-bold mt-1">
                              Linked: {linkedProduct.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteCamera(cam.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Center / Right: Live View feed monitor & Statistics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Active Counting Stream Panel */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-slate-800/50 shadow-2xl flex flex-col gap-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity size={16} className="text-blue-500" />
                  {tLocal.liveFeed}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  Active Camera: <span className="text-blue-500">{selectedCamera?.name || 'Local webcam'}</span>
                </p>
              </div>

              {/* Feed Control Buttons */}
              <div className="flex gap-2">
                {selectedCamera?.type === 'WEBCAM' ? (
                  isWebcamActive ? (
                    <button 
                      onClick={stopWebcam} 
                      className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all flex items-center gap-2"
                    >
                      <Pause size={14} /> {tLocal.closeWebcam}
                    </button>
                  ) : (
                    <button 
                      onClick={startWebcam} 
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <Play size={14} /> {tLocal.openWebcam}
                    </button>
                  )
                ) : (
                  <button 
                    onClick={() => setIsSimulating(!isSimulating)} 
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 ${
                      isSimulating 
                        ? 'bg-rose-600 text-white shadow-lg' 
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                    }`}
                  >
                    {isSimulating ? <Pause size={14} /> : <Play size={14} />}
                    {isSimulating ? 'Stop simulation' : tLocal.simulateFeed}
                  </button>
                )}
              </div>
            </div>

            {/* Video container */}
            <div className="w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-800 shadow-inner flex items-center justify-center">
              
              {/* Static scan lines overlay */}
              <div className="absolute inset-0 bg-scanner-lines opacity-10 pointer-events-none z-10" />

              {/* Simulated camera or live webcam stream */}
              {isWebcamActive ? (
                <>
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover transform -scale-x-100" 
                    playsInline 
                    muted 
                  />
                  <canvas 
                    ref={canvasRef} 
                    width={640} 
                    height={480} 
                    className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                  />
                </>
              ) : isSimulating && selectedCamera?.type === 'RTSP' ? (
                // Simulated CCTV feed graphics
                <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
                  <div className="absolute top-4 left-4 text-[10px] text-green-500 font-mono font-bold bg-black/60 px-2 py-1 rounded">
                    ● LIVE RTSP FEED FEEDER_CAM_01
                  </div>
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 border border-slate-800 opacity-20 pointer-events-none" />
                  
                  {/* Virtual Scanning Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-500 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                  
                  <div className="flex flex-col items-center gap-3 text-center text-slate-500">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">AI Line Crossing Detection Active</p>
                    <p className="text-[10px] text-slate-600 font-mono max-w-xs">{selectedCamera.url}</p>
                  </div>
                </div>
              ) : (
                // Camera standby view
                <div className="flex flex-col items-center gap-3 text-center p-6 text-slate-500">
                  <Video size={48} className="text-slate-700 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">Camera Feed Offline</p>
                  <p className="text-[10px] text-slate-600 max-w-xs">
                    Configure a camera and click "Start Webcam" or "Simulate CCTV" above to test the package crossing algorithm.
                  </p>
                </div>
              )}

              {/* Laser HUD UI */}
              {(isWebcamActive || isSimulating) && (
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-md shadow flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    {tLocal.countingActive}
                  </span>
                </div>
              )}
            </div>

            {/* In / Out Counts Banner */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-4 rounded-2xl border border-emerald-500/20 text-center relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-emerald-500/10 group-hover:scale-110 transition-transform">
                  <CheckCircle size={80} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{tLocal.inCount}</h3>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-2">{countIn} <span className="text-[10px] text-slate-400 font-bold">Packs</span></p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">({countIn * (selectedCamera?.packSize || 50)} items)</p>
              </div>

              <div className="bg-gradient-to-br from-rose-500/10 to-rose-500/5 p-4 rounded-2xl border border-rose-500/20 text-center relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 text-rose-500/10 group-hover:scale-110 transition-transform">
                  <AlertCircle size={80} />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">{tLocal.outCount}</h3>
                <p className="text-3xl font-black text-rose-700 dark:text-rose-400 mt-2">{countOut} <span className="text-[10px] text-slate-400 font-bold">Packs</span></p>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">({countOut * (selectedCamera?.packSize || 50)} items)</p>
              </div>
            </div>

            {/* Sync Database Button Banner */}
            <div className="bg-white/60 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                  <Database size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{tLocal.totalCounted}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Ready to sync: <strong className="text-blue-500">{(countIn + countOut) * (selectedCamera?.packSize || 50)}</strong> plastic bottles.
                  </p>
                </div>
              </div>

              <button
                onClick={handleSyncToInventory}
                disabled={syncing || (countIn === 0 && countOut === 0)}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
              >
                {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {tLocal.syncInventory}
              </button>
            </div>
          </div>

          {/* Activity Logs & Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Live activity log */}
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-slate-800/50 shadow-2xl flex flex-col gap-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <Activity size={14} className="text-blue-500" />
                {tLocal.logsTitle}
              </h2>

              <div className="flex flex-col gap-2 overflow-y-auto max-h-[200px] scrollbar-hide">
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-[10px] font-medium uppercase tracking-wider">
                    Waiting for events...
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="p-3 bg-white/60 dark:bg-slate-950/20 border border-slate-200/20 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${log.direction === 'IN' ? 'bg-emerald-500 animate-ping' : 'bg-rose-500 animate-ping'}`} />
                        <div>
                          <p className="font-black text-slate-800 dark:text-white">
                            {log.direction === 'IN' ? 'wax soo galay' : 'wax baxay'}
                          </p>
                          <p className="text-[9px] text-slate-400 font-medium">
                            Bundle of {log.packSize} Pcs
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400 font-bold">{log.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Hourly charts */}
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/50 dark:border-slate-800/50 shadow-2xl flex flex-col gap-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp size={14} className="text-blue-500" />
                Waxsoosaarka Maanta (Hourly)
              </h2>

              <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="hour" stroke="#888888" fontSize={9} tickLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '8px', fontSize: '11px', color: '#fff' }} />
                    <Line type="monotone" dataKey="in" name="Packs IN" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="out" name="Packs OUT" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
