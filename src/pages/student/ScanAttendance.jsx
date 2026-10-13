/**
 * ScanAttendance.jsx — Sequential QR → Face → GPS → Submit flow
 *
 * Flow:
 *  Step 1  Scan QR (BarcodeDetector API or manual entry)
 *  Step 2  Face Verification (auto-capture, descriptor sent to backend)
 *  Step 3  GPS Geofencing (acquire coordinates)
 *  Step 4  Submit to backend — backend decides everything
 *  Step 5  Result
 *
 * SECURITY: Frontend only collects data. Backend validates all checks.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  QrCode, MapPin, Loader2, CheckCircle2, XCircle,
  AlertTriangle, Camera, CameraOff, RefreshCw,
  ShieldCheck, User, Wifi, Clock, Lock,
} from 'lucide-react';
import { Button }            from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import FaceCapture           from '../../components/FaceCapture';
import studentService        from '../../services/student.service';
import { getGeolocation }    from '../../services/api';
import { serializeDescriptor } from '../../services/face.service';
import { getErrorMessage }   from '../../utils/error';

// ─── Result config ────────────────────────────────────────────────────────────
const RESULT_CFG = {
  SUCCESS:          { icon: CheckCircle2,  bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', title: 'Attendance Marked!' },
  QR_EXPIRED:       { icon: Clock,         bg: 'from-rose-500 to-rose-600',       light: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    title: 'Session Expired' },
  QR_INVALID:       { icon: XCircle,       bg: 'from-rose-500 to-rose-600',       light: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    title: 'Invalid QR Code' },
  OUTSIDE_LOCATION: { icon: MapPin,        bg: 'from-amber-500 to-orange-500',    light: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   title: 'Outside Classroom' },
  GPS_REQUIRED:     { icon: MapPin,        bg: 'from-amber-500 to-orange-500',    light: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   title: 'Location Required' },
  NOT_ENROLLED:     { icon: Lock,          bg: 'from-rose-500 to-rose-600',       light: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    title: 'Not Enrolled' },
  ALREADY_MARKED:   { icon: CheckCircle2,  bg: 'from-sky-500 to-sky-600',         light: 'bg-sky-50 border-sky-200',         text: 'text-sky-700',     title: 'Already Present' },
  FACE_FAILED:      { icon: ShieldCheck,   bg: 'from-amber-500 to-orange-500',    light: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   title: 'Face Mismatch' },
  FACE_CANCELLED:   { icon: ShieldCheck,   bg: 'from-slate-500 to-slate-600',     light: 'bg-slate-50 border-slate-200',     text: 'text-slate-600',   title: 'Verification Cancelled' },
  NO_FACE_PHOTO:    { icon: User,          bg: 'from-amber-500 to-orange-500',    light: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   title: 'Face Not Registered' },
  SESSION_INACTIVE: { icon: XCircle,       bg: 'from-rose-500 to-rose-600',       light: 'bg-rose-50 border-rose-200',       text: 'text-rose-700',    title: 'Session Ended' },
  NETWORK_ERROR:    { icon: Wifi,          bg: 'from-amber-500 to-orange-500',    light: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   title: 'Network Error' },
  GENERIC_ERROR:    { icon: AlertTriangle, bg: 'from-slate-500 to-slate-600',     light: 'bg-slate-50 border-slate-200',     text: 'text-slate-600',   title: 'Error' },
};

const RESULT_HINTS = {
  NO_FACE_PHOTO:    'Go to Profile → Face Verification to register your face photo.',
  FACE_FAILED:      'Your face did not match. Contact your teacher to authorize a photo update.',
  OUTSIDE_LOCATION:
    'You must be inside the classroom within the allowed radius. Ask your teacher to re-detect GPS in the room when starting the session, then try again.',
  GPS_REQUIRED:
    'Location is required to mark attendance. Allow location access and ensure GPS is enabled on your phone.',
  ALREADY_MARKED:   'Your attendance is already recorded for this session.',
  QR_EXPIRED:       'The session has ended. Contact your teacher if needed.',
  SESSION_INACTIVE: 'No active session found. Ask your teacher to confirm.',
  FACE_CANCELLED:   'Attendance was not marked because face verification was skipped.',
};

const classifyError = (message = '') => {
  const m = message.toLowerCase();
  if (m.includes('expired'))                                                              return 'QR_EXPIRED';
  if ((m.includes('invalid') || m.includes('not found')) &&
      (m.includes('qr') || m.includes('token') || m.includes('session')))               return 'QR_INVALID';
  if (m.includes('geofence') || m.includes('outside') || m.includes('radius') ||
      m.includes('location'))                                                             return 'OUTSIDE_LOCATION';
  if (m.includes('enrollment') || m.includes('enrolled') || m.includes('program') ||
      m.includes('section') || m.includes('department') || m.includes('academic year')) return 'NOT_ENROLLED';
  if (m.includes('already') || m.includes('duplicate') || m.includes('conflict'))       return 'ALREADY_MARKED';
  if (m.includes('no face') || m.includes('face photo') || m.includes('not registered')) return 'NO_FACE_PHOTO';
  if (m.includes('face'))                                                                return 'FACE_FAILED';
  if (m.includes('inactive') || m.includes('unavailable') || m.includes('session is')) return 'SESSION_INACTIVE';
  if (m.includes('network') || m.includes('connect') || m.includes('econnrefused'))    return 'NETWORK_ERROR';
  return 'GENERIC_ERROR';
};

const parseQrPayload = (raw) => {
  try { const p = JSON.parse(atob(raw.trim())); if (p?.sessionId && p?.token) return p; } catch {}
  try { const p = JSON.parse(raw.trim());       if (p?.sessionId && p?.token) return p; } catch {}
  return null;
};

// ─── Step pill ────────────────────────────────────────────────────────────────
function StepPill({ steps, current }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {steps.map((s, i) => {
        const done   = i + 1 < current;
        const active = i + 1 === current;
        return (
          <React.Fragment key={i}>
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
              done   ? 'bg-emerald-100 text-emerald-700' :
              active ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' :
                       'bg-slate-100 text-slate-400'
            }`}>
              {done ? <CheckCircle2 className="w-3 h-3" /> : <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${active ? 'bg-white/25' : 'bg-slate-200'}`}>{i+1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-4 rounded-full transition-colors ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ScanAttendance() {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const detectorRef = useRef(null);
  const rafRef      = useRef(null);

  const [step,          setStep]       = useState(1);
  const [qrPayload,     setQrPayload]  = useState(null);
  const [coords,        setCoords]     = useState(null);
  const [result,        setResult]     = useState(null);
  const [cameraActive,  setCameraActive] = useState(false);
  const [cameraError,   setCameraError]  = useState(null);
  const [faceModalOpen, setFaceModal]  = useState(false);
  const [faceError,     setFaceError]  = useState('');
  const [locStatus,     setLocStatus]  = useState('idle');

  // ── QR camera ────────────────────────────────────────────────────────────
  const startQrCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera requires a secure HTTPS connection.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      setCameraActive(true);
      if ('BarcodeDetector' in window) detectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      startDetectionLoop();
    } catch (err) {
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera permission denied. Allow camera access in your browser settings.'
        : `Camera unavailable: ${err.message}`);
    }
  };

  const stopQrCamera = useCallback(() => {
    if (rafRef.current)    { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    // Nullify srcObject FIRST so browser knows camera is being released
    if (videoRef.current)  { videoRef.current.srcObject = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => { t.stop(); });
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopQrCamera(), [stopQrCamera]);

  const startDetectionLoop = () => {
    const detect = async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) { rafRef.current = requestAnimationFrame(detect); return; }
      let raw = null;
      if (detectorRef.current && videoRef.current.videoWidth > 0) {
        try { const b = await detectorRef.current.detect(videoRef.current); if (b.length) raw = b[0].rawValue; } catch {}
      }
      if (raw) { handleQrDetected(raw); return; }
      rafRef.current = requestAnimationFrame(detect);
    };
    if (videoRef.current) videoRef.current.addEventListener('loadeddata', () => { rafRef.current = requestAnimationFrame(detect); }, { once: true });
  };

  const handleQrDetected = async (raw) => {
    // Stop QR camera FIRST and wait for hardware to release
    stopQrCamera();
    // Give the browser 300ms to fully release the camera hardware on mobile
    await new Promise(r => setTimeout(r, 300));

    const payload = parseQrPayload(raw);
    if (!payload) {
      setResult({ state: 'QR_INVALID', message: 'The scanned code does not contain valid attendance data.' });
      setStep(5); return;
    }

    // Open face modal — camera starts loading while session check runs in background
    setQrPayload(payload);
    setFaceError('');
    setFaceModal(true);

    // Background session check
    const status = await studentService.checkSessionStatus(payload.sessionId).catch(() => null);
    if (status && !status.sessionActive) {
      setFaceModal(false);
      setQrPayload(null);
      setResult({ state: 'SESSION_INACTIVE', message: 'This session has ended. You can no longer mark attendance.' });
      setStep(5); return;
    }
    if (status && status.alreadyMarked) {
      setFaceModal(false);
      setQrPayload(null);
      setResult({ state: 'ALREADY_MARKED', message: 'Your attendance for this session is already recorded.' });
      setStep(5); return;
    }
    setStep(2); // now officially on face step
  };

  const handleFaceCaptured = async ({ descriptor }) => {
    setFaceModal(false);
    setStep(3);
    await doRequestLocation(qrPayload, descriptor);
  };

  const handleFaceCancelled = () => {
    setFaceModal(false);
    setResult({ state: 'FACE_CANCELLED', message: 'Face verification was cancelled. Attendance not marked.' });
    setStep(5);
  };

  const doRequestLocation = async (payload, descriptor) => {
    setLocStatus('loading');
    let position = null;
    try {
      position = await getGeolocation();
      setCoords(position);
      setLocStatus('ok');
    } catch (err) {
      setLocStatus('denied');
      const msg = getErrorMessage(err, 'Could not read your GPS location.');
      setResult({ state: 'GPS_REQUIRED', message: msg });
      setStep(5);
      return;
    }
    setStep(4);
    await doSubmit(payload, descriptor, position);
  };

  const doSubmit = async (payload, descriptor, position) => {
    if (!position?.latitude || !position?.longitude) {
      setResult({
        state: 'GPS_REQUIRED',
        message: 'GPS coordinates missing. Allow location and try again.',
      });
      setStep(5);
      return;
    }
    try {
      const data = await studentService.markAttendance({
        sessionId:  payload.sessionId,
        token:      payload.token,
        latitude:   position.latitude,
        longitude:  position.longitude,
        accuracy:   position.accuracy,
        faceVerificationData: descriptor ? { descriptor: serializeDescriptor(descriptor), ts: Date.now() } : null,
      });
      setResult({ state: 'SUCCESS', message: 'Your attendance has been recorded successfully.', data });
    } catch (err) {
      const msg = getErrorMessage(err);
      setResult({ state: classifyError(msg), message: msg });
    } finally {
      setStep(5);
    }
  };

  const handleReset = () => {
    setResult(null); setQrPayload(null); setCoords(null);
    setStep(1); setLocStatus('idle'); setCameraError(null);
    setFaceModal(false); setFaceError('');
  };

  const isInsecure = typeof window !== 'undefined' &&
    window.location.protocol !== 'https:' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1';

  const STEP_LABELS = ['Scan QR', 'Face', 'Location', 'Submit', 'Result'];

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200 mb-3">
          <QrCode className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Scan Attendance</h1>
        <p className="text-xs text-slate-500 mt-1">QR → Face → Location → Server verification</p>
      </div>

      {/* Step pills */}
      <StepPill steps={STEP_LABELS} current={step} />

      {/* HTTPS warning */}
      {isInsecure && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">HTTPS required</p>
            <p className="text-xs text-amber-700 mt-0.5">Camera and GPS require a secure connection. Open this page on <strong>https://</strong>.</p>
          </div>
        </div>
      )}

      {/* ── STEP 1: QR Scanner ─────────────────────────────────────────────── */}
      {!result && step === 1 && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Camera viewport */}
            <div className="relative bg-slate-950 aspect-square">
              <video ref={videoRef} playsInline muted
                className={`w-full h-full object-cover transition-opacity duration-300 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* QR frame overlay */}
              {cameraActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {/* Dark edges */}
                  <div className="absolute inset-0 bg-black/40" style={{ clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%,0 35%,35% 35%,35% 65%,65% 65%,65% 35%,0 35%)' }} />
                  {/* Bright box */}
                  <div className="w-52 h-52 relative">
                    {/* Corner L-marks */}
                    {[
                      'top-0 left-0',   'top-0 right-0 rotate-90',
                      'bottom-0 left-0 -rotate-90', 'bottom-0 right-0 rotate-180',
                    ].map((pos, i) => (
                      <div key={i} className={`absolute ${pos} w-8 h-8`}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 rounded" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-400 rounded" />
                      </div>
                    ))}
                    {/* Scan line */}
                    <div className="absolute inset-x-1 h-0.5 bg-indigo-400/80 rounded-full"
                      style={{ top: '50%', animation: 'scanLine 2s ease-in-out infinite' }}
                    />
                  </div>
                </div>
              )}

              {/* Idle state */}
              {!cameraActive && !cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-600 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Camera not active</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3">
              {cameraError && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
              {!cameraActive
                ? (
                  <Button onClick={startQrCamera} className="w-full" leftIcon={<Camera className="w-4 h-4" />}>
                    Start Camera
                  </Button>
                ) : (
                  <Button onClick={stopQrCamera} variant="secondary" className="w-full" leftIcon={<CameraOff className="w-4 h-4" />}>
                    Stop Camera
                  </Button>
                )
              }
              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Point at your teacher's QR code. Face &amp; location will be verified automatically.
                {!('BarcodeDetector' in window) && ' (Auto-detection may not be supported — use manual entry below.)'}
              </p>
            </div>
          </div>

          {/* Manual fallback */}
          {!cameraActive && <ManualEntry onSubmit={(payload) => { setQrPayload(payload); setStep(2); setFaceError(''); setFaceModal(true); }} />}
        </div>
      )}

      {/* ── STEP 3: GPS ────────────────────────────────────────────────────── */}
      {!result && step === 3 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-indigo-500 animate-pulse" />
          </div>
          <p className="font-semibold text-slate-800">Getting Location…</p>
          <p className="text-xs text-slate-400">Allow location access when prompted.</p>
        </div>
      )}

      {/* ── STEP 4: Submitting ─────────────────────────────────────────────── */}
      {!result && step === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
            <Loader2 className="w-7 h-7 text-indigo-500 animate-spin" />
          </div>
          <p className="font-semibold text-slate-800">Submitting Attendance…</p>
          <p className="text-xs text-slate-400">Please wait a moment.</p>
        </div>
      )}

      {/* ── STEP 5: Result ─────────────────────────────────────────────────── */}
      {result && <ResultCard result={result} onReset={handleReset} />}

      {/* ── Face Verification Overlay ──────────────────────────────────────── */}
      {faceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-sm">
          {/* Bottom-sheet on mobile, centered card on larger screens */}
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">

            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-slate-200" />
            </div>

            {/* Header bar */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">Face Verification</p>
                  <p className="text-indigo-200 text-[11px]">Step 2 of 4 — Identity Check</p>
                </div>
              </div>
              {/* mini progress dots */}
              <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`rounded-full transition-all ${
                    i < 2  ? 'w-1.5 h-1.5 bg-white/60' :
                    i === 2 ? 'w-5 h-1.5 bg-white' :
                               'w-1.5 h-1.5 bg-white/25'
                  }`} />
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="mx-4 mt-4 flex items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Your face data is compared server-side. No decision is made on this device.
              </p>
            </div>

            {/* Error banner */}
            {faceError && (
              <div className="mx-4 mt-3 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5 text-xs text-rose-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{faceError}</span>
              </div>
            )}

            {/* FaceCapture */}
            <div className="px-4 pb-5 pt-1">
              <FaceCapture
                onCapture={handleFaceCaptured}
                onCancel={handleFaceCancelled}
                onError={(msg) => setFaceError(msg)}
                compact={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Inline scan-line animation */}
      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-100%); opacity: 0.6; }
          50% { transform: translateY(100%); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────
function ResultCard({ result, onReset }) {
  const cfg  = RESULT_CFG[result?.state] || RESULT_CFG.GENERIC_ERROR;
  const Icon = cfg.icon;
  const hint = RESULT_HINTS[result?.state];
  const isSuccess    = result?.state === 'SUCCESS';
  const isAlreadyDone = result?.state === 'ALREADY_MARKED';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Colored top bar */}
      <div className={`bg-gradient-to-r ${cfg.bg} px-5 py-5 flex items-center gap-4`}>
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-base leading-tight">{cfg.title}</p>
          <p className="text-white/75 text-xs mt-0.5 leading-relaxed">{result?.message}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* SUCCESS details */}
        {isSuccess && result.data && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Session Details</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { label: 'Subject',   value: result.data.session?.subject?.name },
                { label: 'Section',   value: result.data.session?.section?.name },
                { label: 'Marked At', value: result.data.markedAt ? new Date(result.data.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : null },
              ].filter(f => f.value).map((f, i) => (
                <div key={i} className="bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-medium">{f.label}</p>
                  <p className="text-slate-800 font-semibold mt-0.5 truncate">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Verification badges */}
            {result.data.verificationDetails && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { key: 'qrVerified',         label: 'QR Code' },
                  { key: 'enrollmentVerified',  label: 'Enrollment' },
                  { key: 'locationVerified',    label: 'Location' },
                  { key: 'faceVerified',        label: 'Face' },
                ].filter(v => result.data.verificationDetails[v.key]).map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full px-2.5 py-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> {v.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hint */}
        {hint && (
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 border text-xs ${cfg.light} ${cfg.text}`}>
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{hint}</span>
          </div>
        )}

        {/* Actions */}
        {!isSuccess && !isAlreadyDone && (
          <Button onClick={onReset} variant="outline" className="w-full" leftIcon={<RefreshCw className="w-4 h-4" />}>
            Try Again
          </Button>
        )}

        {(isSuccess || isAlreadyDone) && (
          <div className="flex items-center gap-2 justify-center text-xs text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>You're all set — no further action needed.</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Manual QR entry ──────────────────────────────────────────────────────────
function ManualEntry({ onSubmit }) {
  const [open, setOpen] = useState(false);
  const [raw,  setRaw]  = useState('');
  const [err,  setErr]  = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); setErr('');
    const payload = parseQrPayload(raw.trim());
    if (!payload) { setErr('Could not parse QR content. Paste the complete QR payload.'); return; }
    setOpen(false); setRaw(''); onSubmit(payload);
  };

  if (!open) return (
    <p className="text-center text-[11px] text-slate-400 py-1">
      Camera not working?{' '}
      <button onClick={() => setOpen(true)} className="text-indigo-600 underline font-medium">Enter QR data manually</button>
    </p>
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
      <p className="text-xs font-semibold text-slate-700">Paste QR payload</p>
      <textarea
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
        rows={4} value={raw} onChange={e => setRaw(e.target.value)}
        placeholder="Paste base64 or JSON QR content here…"
      />
      {err && <p className="text-xs text-rose-600">{err}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" className="flex-1" onClick={handleSubmit}>Submit</Button>
        <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  );
}
