/**
 * FaceCapture.jsx — Modern face verification UI
 *
 * Features:
 *  - Clean status phases: initializing → aligning → scanning → verifying → done
 *  - Circular face-positioning guide with animated progress ring
 *  - Real-time face detection at optimized 200ms interval (CPU-friendly)
 *  - Auto-capture after face held steady for 1.5s — no button press needed
 *  - Smooth CSS animations, responsive for mobile/tablet/desktop
 *  - Proper cleanup on unmount — no camera leaks
 *
 * Props:
 *   onCapture({ descriptor, imageDataUrl })
 *   onError(msg)
 *   onCancel()
 *   compact  — boolean, smaller layout for modals (default false)
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { Button } from './ui/Button';
import { loadModels, captureAndExtract } from '../services/face.service';
import * as faceapi from 'face-api.js';

const AUTO_CAPTURE_DELAY  = 1500; // ms face must stay visible
const DETECT_INTERVAL_MS  = 200;  // detection tick

// Phase definitions — drive all UI from a single phase string
const PHASES = {
  INIT:       'init',       // loading models
  CAMERA:     'camera',     // starting camera
  ALIGNING:   'aligning',   // camera live, no face yet
  SCANNING:   'scanning',   // face detected, counting down
  CAPTURING:  'capturing',  // extracting descriptor
  DONE:       'done',       // success — descriptor extracted
  ERROR:      'error',      // something went wrong
};

const PHASE_META = {
  [PHASES.INIT]:      { label: 'Initializing…',        color: 'indigo',  ring: false },
  [PHASES.CAMERA]:    { label: 'Starting Camera…',      color: 'indigo',  ring: false },
  [PHASES.ALIGNING]:  { label: 'Position Your Face',    color: 'amber',   ring: false },
  [PHASES.SCANNING]:  { label: 'Hold Still…',           color: 'emerald', ring: true  },
  [PHASES.CAPTURING]: { label: 'Verifying Identity…',   color: 'indigo',  ring: false },
  [PHASES.DONE]:      { label: 'Verification Complete', color: 'emerald', ring: false },
  [PHASES.ERROR]:     { label: 'Camera Error',          color: 'rose',    ring: false },
};

export default function FaceCapture({ onCapture, onError, onCancel, compact = false }) {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const streamRef    = useRef(null);
  const mountedRef   = useRef(true);
  const intervalRef  = useRef(null);
  const faceStartRef = useRef(null);
  const capturingRef = useRef(false);

  const [phase,       setPhase]    = useState(PHASES.INIT);
  const [progress,    setProgress] = useState(0);
  const [errorMsg,    setErrorMsg] = useState('');
  const [initLabel,   setInitLabel] = useState('Loading face models…');

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopAll();
    };
  }, []);

  const stopAll = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (videoRef.current)    { videoRef.current.srcObject = null; }
    if (streamRef.current)   { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  }, []);

  // ── Boot — runs once per mount. The `cancelled` flag handles StrictMode's
  //    double-invocation: the cleanup sets cancelled=true before the second
  //    run begins, so the second run's async work exits early.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setPhase(PHASES.INIT);
        setInitLabel('Loading face detection models…');
        await loadModels();
        if (cancelled || !mountedRef.current) return;

        setPhase(PHASES.CAMERA);
        setInitLabel('Requesting camera access…');
        await startCamera();
      } catch (err) {
        if (cancelled || !mountedRef.current) return;
        setErrorMsg('Failed to load face detection. Please refresh the page.');
        setPhase(PHASES.ERROR);
      }
    })();

    return () => {
      cancelled = true;
      // Also stop any stream that was started before cleanup
      stopAll();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Camera requires a secure HTTPS connection (https://).');
      setPhase(PHASES.ERROR);
      return;
    }
    try {
      // Small delay to ensure any previously active camera stream is fully released
      await new Promise(r => setTimeout(r, 150));
      if (!mountedRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width:  { ideal: 480 },
          height: { ideal: 480 },
        },
      });
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;

      // Wait one animation frame so the video element is fully laid out
      // before assigning srcObject — critical on Android Chrome
      await new Promise(r => requestAnimationFrame(r));
      if (!mountedRef.current) { stream.getTracks().forEach(t => t.stop()); streamRef.current = null; return; }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {}); // play() can be interrupted on some browsers
      }
      if (mountedRef.current) {
        setPhase(PHASES.ALIGNING);
        startDetection();
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err.name === 'NotAllowedError'
        ? 'Camera permission denied. Please allow camera access in your browser settings and try again.'
        : `Camera unavailable: ${err.message}`;
      setErrorMsg(msg);
      setPhase(PHASES.ERROR);
      if (onError) onError(msg);
    }
  };

  // ── Detection loop ────────────────────────────────────────────────────────
  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (!mountedRef.current || capturingRef.current) return;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || !video.videoWidth) return;

      try {
        const sz = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, sz);

        const detections = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
          .withFaceLandmarks();

        if (!mountedRef.current) return;

        const resized = faceapi.resizeResults(detections, sz);
        const ctx     = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const hasFace = resized.length > 0;

        if (hasFace) {
          // Subtle face-box overlay
          resized.forEach(d => {
            const { x, y, width, height } = d.detection.box;
            ctx.strokeStyle = 'rgba(34,197,94,0.8)';
            ctx.lineWidth   = 2;
            ctx.strokeRect(x, y, width, height);
          });

          if (!faceStartRef.current) faceStartRef.current = Date.now();
          const elapsed = Date.now() - faceStartRef.current;
          const pct     = Math.min(100, (elapsed / AUTO_CAPTURE_DELAY) * 100);
          setProgress(pct);
          setPhase(PHASES.SCANNING);

          if (elapsed >= AUTO_CAPTURE_DELAY && !capturingRef.current) {
            capturingRef.current = true;
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            await doCapture(video);
          }
        } else {
          faceStartRef.current = null;
          setProgress(0);
          setPhase(PHASES.ALIGNING);
        }
      } catch { /* silent */ }
    }, DETECT_INTERVAL_MS);
  };

  const doCapture = async (video) => {
    if (!mountedRef.current) return;
    setPhase(PHASES.CAPTURING);
    try {
      const descriptor = await captureAndExtract(video);
      if (!descriptor) {
        if (mountedRef.current) {
          capturingRef.current  = false;
          faceStartRef.current  = null;
          setProgress(0);
          setPhase(PHASES.ALIGNING);
          startDetection();
        }
        return;
      }
      const snap = document.createElement('canvas');
      snap.width  = video.videoWidth;
      snap.height = video.videoHeight;
      snap.getContext('2d').drawImage(video, 0, 0);
      const imageDataUrl = snap.toDataURL('image/jpeg', 0.80);

      stopAll();
      if (mountedRef.current) {
        setPhase(PHASES.DONE);
        onCapture({ descriptor, imageDataUrl });
      }
    } catch (err) {
      if (mountedRef.current) {
        capturingRef.current = false;
        faceStartRef.current = null;
        setProgress(0);
        setErrorMsg(`Capture failed: ${err.message}`);
        setPhase(PHASES.ALIGNING);
        startDetection();
      }
    }
  };

  const handleRetry = async () => {
    stopAll();
    capturingRef.current = false;
    faceStartRef.current = null;
    setErrorMsg('');
    setProgress(0);
    setPhase(PHASES.CAMERA);
    await startCamera();
  };

  // ── Derived UI values ─────────────────────────────────────────────────────
  const meta      = PHASE_META[phase] || PHASE_META[PHASES.ALIGNING];
  const showVideo = phase !== PHASES.INIT && phase !== PHASES.CAMERA && phase !== PHASES.ERROR && phase !== PHASES.DONE;

  // SVG ring geometry
  const R   = compact ? 88 : 104;
  const C   = 2 * Math.PI * R;
  const SVG = (R + 8) * 2;
  const strokeOffset = C - (progress / 100) * C;

  // Color classes by phase color
  const colorCls = {
    indigo:  { badge: 'bg-indigo-50 border-indigo-200 text-indigo-700',   dot: 'bg-indigo-500', ring: '#6366f1' },
    amber:   { badge: 'bg-amber-50 border-amber-200 text-amber-700',     dot: 'bg-amber-400',  ring: '#f59e0b' },
    emerald: { badge: 'bg-emerald-50 border-emerald-200 text-emerald-700', dot: 'bg-emerald-500', ring: '#22c55e' },
    rose:    { badge: 'bg-rose-50 border-rose-200 text-rose-700',         dot: 'bg-rose-500',   ring: '#f43f5e' },
  };
  const cc = colorCls[meta.color] || colorCls.indigo;

  // Camera size
  const camSize = compact ? 'w-52 h-52' : 'w-64 h-64 sm:w-72 sm:h-72';

  return (
    <div className={`flex flex-col items-center gap-4 ${compact ? 'py-2' : 'py-4'}`}>

      {/* ── Status badge ─────────────────────────────────────────── */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold transition-all ${cc.badge}`}>
        {(phase === PHASES.INIT || phase === PHASES.CAMERA || phase === PHASES.CAPTURING) && (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        )}
        {phase === PHASES.ALIGNING && <span className={`w-2 h-2 rounded-full ${cc.dot} animate-pulse`} />}
        {phase === PHASES.SCANNING && <span className={`w-2 h-2 rounded-full ${cc.dot}`} />}
        {phase === PHASES.DONE && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        {phase === PHASES.ERROR && <AlertTriangle className="w-3.5 h-3.5" />}
        <span>{meta.label}</span>
      </div>

      {/* ── Initializing / camera starting ───────────────────────── */}
      {(phase === PHASES.INIT || phase === PHASES.CAMERA) && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className={`${camSize} rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center`}>
              <ShieldCheck className="w-12 h-12 text-slate-300" />
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
          </div>
          <p className="text-xs text-slate-500 text-center max-w-[200px]">{initLabel}</p>
        </div>
      )}

      {/* ── Error state ───────────────────────────────────────────── */}
      {phase === PHASES.ERROR && (
        <div className="w-full space-y-3">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-rose-800">Camera Error</p>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">{errorMsg}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handleRetry}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              className="flex-1"
            >
              Retry
            </Button>
            {onCancel && (
              <Button variant="secondary" size="sm" onClick={() => { stopAll(); onCancel(); }} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Live camera + ring ────────────────────────────────────── */}
      {/* Video/canvas always in DOM so refs are valid when stream arrives.
          Hidden via opacity+pointer-events when not in active camera phase. */}
      <div className={`flex flex-col items-center gap-3 w-full ${!showVideo ? 'opacity-0 pointer-events-none absolute' : ''}`}>
          {/* Instruction text */}
          {showVideo && <p className={`text-xs text-center leading-relaxed ${
            phase === PHASES.SCANNING ? 'text-emerald-600 font-semibold' : 'text-slate-500'
          }`}>
            {phase === PHASES.SCANNING
              ? `Hold steady — capturing in ${((AUTO_CAPTURE_DELAY - Math.min((progress / 100) * AUTO_CAPTURE_DELAY, AUTO_CAPTURE_DELAY)) / 1000).toFixed(1)}s`
              : 'Center your face inside the circle. Ensure good lighting.'
            }
          </p>}

          {/* Camera circle with ring overlay */}
          <div className="relative flex items-center justify-center">
            {/* Outer SVG ring */}
            <svg
              width={SVG}
              height={SVG}
              className="absolute"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track */}
              <circle
                cx={SVG / 2} cy={SVG / 2} r={R}
                fill="none"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="5"
              />
              {/* Progress */}
              <circle
                cx={SVG / 2} cy={SVG / 2} r={R}
                fill="none"
                stroke={cc.ring}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={strokeOffset}
                style={{ transition: 'stroke-dashoffset 0.2s linear, stroke 0.3s ease' }}
              />
            </svg>

            {/* Circular video mask */}
            <div className={`${camSize} rounded-full overflow-hidden border-4 relative shadow-xl`}
              style={{ borderColor: cc.ring }}>
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ transform: 'scaleX(-1)' }}
              />

              {/* Capturing overlay */}
              {phase === PHASES.CAPTURING && (
                <div className="absolute inset-0 bg-indigo-900/60 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                  <span className="text-white text-xs font-semibold">Verifying…</span>
                </div>
              )}

              {/* Flash on capture */}
              {phase === PHASES.CAPTURING && (
                <div className="absolute inset-0 bg-white animate-ping opacity-20 rounded-full" />
              )}
            </div>

            {/* Corner guide marks (subtle) */}
            {phase === PHASES.ALIGNING && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
                <div className={`${camSize} rounded-full border-2 border-dashed border-white/50`} />
              </div>
            )}
          </div>

          {/* Progress bar (below camera) */}
          {phase === PHASES.SCANNING && (
            <div className="w-full max-w-[180px]">
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error inline (non-fatal) */}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 w-full">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showVideo && onCancel && (
            <Button
              variant="ghost" size="sm"
              onClick={() => { stopAll(); onCancel(); }}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              Cancel verification
            </Button>
          )}
        </div>

      {/* ── Done ─────────────────────────────────────────────────── */}
      {phase === PHASES.DONE && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-emerald-700">Face Captured Successfully</p>
          <p className="text-xs text-slate-400">Proceeding to location verification…</p>
        </div>
      )}
    </div>
  );
}
