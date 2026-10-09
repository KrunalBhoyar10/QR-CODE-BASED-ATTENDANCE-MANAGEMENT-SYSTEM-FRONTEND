import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, Layers, Grid, Users, QrCode, Clock, CheckCircle2,
  XCircle, AlertCircle, Play, StopCircle, RefreshCw, Maximize2,
  Minimize2, ChevronRight, ShieldCheck, UserCheck, MapPin, Copy,
  Check, Eye, ArrowLeft, Award, FileText, GraduationCap, Calendar, Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { teacherService } from '../../services/teacher.service';
import { getErrorMessage } from '../../utils/error';

// ─── StatBox Helper ─────────────────────────────────────────────────────────
const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-500', border: 'border-indigo-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500', border: 'border-emerald-200' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500', border: 'border-rose-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', icon: 'text-violet-500', border: 'border-violet-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500', border: 'border-amber-200' },
};

const StatBox = ({ icon: Icon, label, value, color = 'indigo' }) => {
  const c = colorMap[color] || colorMap.indigo;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 flex flex-col gap-2`}>
      <div className={`w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center ${c.icon}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs font-medium text-slate-500 leading-tight">{label}</p>
      <p className={`text-2xl font-extrabold ${c.text} leading-none`}>{value}</p>
    </div>
  );
};

// Date / Time helpers
const getTodayDateString = () => new Date().toISOString().split('T')[0];
const getCurrentTimeString = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Core Data
  const [profile, setProfile] = useState(null);
  const [assignmentsData, setAssignmentsData] = useState(null);
  const [activeSessionsList, setActiveSessionsList] = useState([]);

  // Active Flow Step (1: Program -> 2: Subject -> 3: Section -> 4: Students/Config -> 5: QR Session -> 6: Complete)
  const [step, setStep] = useState(1);

  // Selection States
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  // Section Students
  const [sectionStudents, setSectionStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Session Configuration Form
  const [sessionConfig, setSessionConfig] = useState({
    sessionType: 'REGULAR',
    durationMinutes: 15,
    sessionDate: getTodayDateString(),
    startTime: getCurrentTimeString(),
    enableGps: false,
    allowedRadius: 100,
    latitude: null,
    longitude: null,
    accuracy: null,
    faceVerificationRequired: false,
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);

  // Active Session & QR State
  const [activeSession, setActiveSession] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [qrPayloadRaw, setQrPayloadRaw] = useState('');
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isFullscreenQr, setIsFullscreenQr] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Live Attendance Monitoring
  const [liveAttendanceRecords, setLiveAttendanceRecords] = useState([]);
  const [liveSummary, setLiveSummary] = useState(null);
  const [closingSession, setClosingSession] = useState(false);

  // Final Summary View State
  const [completedSummary, setCompletedSummary] = useState(null);

  // Initial Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profRes, assignRes, activeRes] = await Promise.all([
        teacherService.getProfile().catch(() => null),
        teacherService.getAssignments(),
        teacherService.getActiveSessions().catch(() => ({ data: [] })),
      ]);

      if (profRes?.data) setProfile(profRes.data);
      if (assignRes?.data) setAssignmentsData(assignRes.data);

      const activeList = Array.isArray(activeRes?.data) ? activeRes.data : [];
      setActiveSessionsList(activeList);

      // If an active session exists, auto-resume it!
      if (activeList.length > 0) {
        resumeSession(activeList[0]);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load teacher dashboard'));
    } finally {
      setLoading(false);
    }
  };

  // Timer for active QR session
  useEffect(() => {
    let timer = null;
    if (activeSession && timeLeftSeconds > 0) {
      timer = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSessionExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSession, timeLeftSeconds]);

  // Real-time polling for attendance records when session is active (Step 5)
  useEffect(() => {
    let pollInterval = null;
    if (activeSession && step === 5) {
      fetchLiveAttendance(activeSession.id);
      pollInterval = setInterval(() => {
        fetchLiveAttendance(activeSession.id);
      }, 3000);
    }
    return () => clearInterval(pollInterval);
  }, [activeSession, step]);

  const fetchLiveAttendance = async (sessionId) => {
    try {
      const res = await teacherService.getSessionAttendance(sessionId, { page: 1, limit: 100 });
      if (res?.data) {
        setLiveAttendanceRecords(Array.isArray(res.data) ? res.data : []);
      }
      if (res?.summary) {
        setLiveSummary(res.summary);
      }
    } catch (err) {
      // silent poll
    }
  };

  const handleSessionExpired = async () => {
    toast.error('Attendance session timer expired');
    if (activeSession) {
      await finishSession(activeSession.id);
    }
  };

  const resumeSession = async (sess) => {
    try {
      const sessDetailRes = await teacherService.getSessionById(sess.id);
      const sessData = sessDetailRes?.data?.session || sess;
      const summaryData = sessDetailRes?.data?.attendanceSummary;

      setActiveSession(sessData);
      setLiveSummary(summaryData);

      // Compute remaining time
      const endTime = new Date(sessData.endTime).getTime();
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeftSeconds(remaining);

      // Reconstruct QR payload for display
      const payloadObj = {
        sessionId: sessData.id,
        token: sessData.sessionToken || sessData.token || 'SESSION_ACTIVE',
        expiresAt: sessData.endTime,
      };
      const rawPayload = btoa(JSON.stringify(payloadObj));
      setQrPayloadRaw(rawPayload);
      setQrCodeData(`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(rawPayload)}`);

      setStep(5);
    } catch (err) {
      toast.error('Could not resume active session');
    }
  };

  // Step Navigations
  const handleSelectProgram = (prog) => {
    setSelectedProgram(prog);
    setSelectedSubject(null);
    setSelectedSection(null);
    setSectionStudents([]);
    setStep(2);
  };

  const handleSelectSubject = (sub, year) => {
    setSelectedSubject(sub);
    if (year) setSelectedAcademicYear(year);
    setSelectedSection(null);
    setSectionStudents([]);
    setStep(3);
  };

  const handleSelectSection = async (sec) => {
    setSelectedSection(sec);
    setStep(4);
    fetchStudentsForSection(sec.sectionId || sec.id);
  };

  const fetchStudentsForSection = async (sectionId) => {
    setLoadingStudents(true);
    try {
      const res = await teacherService.getSectionStudents(sectionId);
      const studentList = Array.isArray(res?.data) ? res.data : [];
      setSectionStudents(studentList);
    } catch (err) {
      toast.error('Failed to load section students');
    } finally {
      setLoadingStudents(false);
    }
  };

  // ── GPS Geolocation Detector ────────────────────────────────────────────────
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingLocation(true);
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectingLocation(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy;

        setSessionConfig((prev) => ({
          ...prev,
          enableGps: true,
          latitude: lat,
          longitude: lng,
          accuracy: acc,
        }));
        toast.success(`GPS Location detected: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${Math.round(acc)}m)`);
      },
      (err) => {
        setDetectingLocation(false);
        const msg = err.message || 'Unable to retrieve your current location. Please check browser permissions.';
        setLocationError(msg);
        toast.error(`GPS Error: ${msg}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleToggleGps = (checked) => {
    setSessionConfig((prev) => ({ ...prev, enableGps: checked }));
    if (checked && !sessionConfig.latitude) {
      detectCurrentLocation();
    }
  };

  // ── Create Session Submit (Step 4 -> Step 5) ─────────────────────────────────
  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!selectedSection || !selectedSubject) {
      toast.error('Please select subject and section first');
      return;
    }

    const durationMins = Number(sessionConfig.durationMinutes) || 15;
    if (durationMins < 1) {
      toast.error('Duration must be at least 1 minute');
      return;
    }

    // Find assignment ID from grouped tree
    let assignmentId = selectedSubject.assignmentId;
    if (!assignmentId && assignmentsData?.assignments) {
      const found = assignmentsData.assignments.find(
        (a) => a.subjectId === selectedSubject.subjectId && a.sectionId === (selectedSection.sectionId || selectedSection.id)
      );
      if (found) assignmentId = found.id;
    }

    const dateStr = sessionConfig.sessionDate || getTodayDateString();
    const timeStr = sessionConfig.startTime || getCurrentTimeString();
    const startDateTime = new Date(`${dateStr}T${timeStr}:00`);

    setCreatingSession(true);
    try {
      const payload = {
        teachingAssignmentId: assignmentId,
        subjectId: selectedSubject.subjectId || selectedSubject.id,
        sectionId: selectedSection.sectionId || selectedSection.id,
        programId: selectedProgram?.programId || selectedProgram?.id,
        academicYearId: selectedAcademicYear?.academicYearId || selectedAcademicYear?.id,
        sessionType: sessionConfig.sessionType,
        sessionDate: startDateTime.toISOString(),
        startTime: startDateTime.toISOString(),
        durationMinutes: durationMins,
        allowedRadius: sessionConfig.enableGps ? (Number(sessionConfig.allowedRadius) || 100) : undefined,
        latitude: sessionConfig.enableGps && sessionConfig.latitude != null ? Number(sessionConfig.latitude) : undefined,
        longitude: sessionConfig.enableGps && sessionConfig.longitude != null ? Number(sessionConfig.longitude) : undefined,
        faceVerificationRequired: sessionConfig.faceVerificationRequired,
      };

      const res = await teacherService.createSession(payload);
      const createdData = res?.data || res;

      const sessionObj = createdData.session || createdData;
      const qrObj = createdData.qr || {};

      setActiveSession(sessionObj);

      const rawPayload = qrObj.data || btoa(JSON.stringify(qrObj.payload || { sessionId: sessionObj.id }));
      setQrPayloadRaw(rawPayload);
      setQrCodeData(`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(rawPayload)}`);

      const durSec = durationMins * 60;
      setTimeLeftSeconds(durSec);

      toast.success('Attendance Session Started! QR Code Generated.');
      setStep(5);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create attendance session'));
    } finally {
      setCreatingSession(false);
    }
  };

  // ── Close Session (Step 5 -> Step 6) ─────────────────────────────────────────
  const finishSession = async (sessionId) => {
    const targetSessionId = sessionId || activeSession?.id;
    if (!targetSessionId) {
      toast.error('No active session found to close');
      return;
    }

    setClosingSession(true);
    try {
      await teacherService.closeSession(targetSessionId);

      let finalAttendance = null;
      try {
        finalAttendance = await teacherService.getSessionAttendance(targetSessionId, { page: 1, limit: 100 });
      } catch (attErr) {
        console.warn('Could not fetch final attendance records:', attErr);
      }

      setCompletedSummary({
        session: activeSession || finalAttendance?.data?.session,
        summary: finalAttendance?.summary || liveSummary,
        records: Array.isArray(finalAttendance?.data) ? finalAttendance.data : liveAttendanceRecords,
      });

      setActiveSession(null);
      setTimeLeftSeconds(0);
      setIsFullscreenQr(false);
      toast.success('Attendance session completed and saved to PostgreSQL!');
      setStep(6);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to close session'));
    } finally {
      setClosingSession(false);
    }
  };

  const copyQrPayloadToClipboard = () => {
    if (!qrPayloadRaw) return;
    navigator.clipboard.writeText(qrPayloadRaw);
    setCopiedPayload(true);
    toast.success('QR payload code copied to clipboard');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <Loader fullPage message="Loading Faculty Console..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchInitialData} /></div>;

  const groupedPrograms = assignmentsData?.grouped || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── PROJECTOR FULLSCREEN OVERLAY ────────────────────────────────────── */}
      {isFullscreenQr && activeSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md text-white flex flex-col p-6 sm:p-10 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {activeSession.subject?.name || selectedSubject?.subjectName}
                </h2>
                <Badge variant="indigo" className="text-xs">
                  Section {activeSession.section?.name || selectedSection?.sectionName}
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Scan this QR code using the Attendance Mobile App
              </p>
            </div>

            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => setIsFullscreenQr(false)}
              leftIcon={<Minimize2 className="w-4 h-4" />}
            >
              Exit Projector Mode
            </Button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
            <div className="flex items-center gap-3 bg-white/10 px-6 py-2.5 rounded-full border border-white/20 text-lg">
              <Clock className="w-5 h-5 text-amber-300 animate-spin" />
              <span className="text-slate-300 font-medium">Time Remaining:</span>
              <span className="text-2xl font-mono font-black text-amber-300">{formatTime(timeLeftSeconds)}</span>
            </div>

            <div className="p-6 bg-white rounded-3xl shadow-2xl ring-8 ring-indigo-500/30">
              <img
                src={qrCodeData}
                alt="Fullscreen Attendance QR Code"
                className="w-72 h-72 sm:w-96 sm:h-96 md:w-[420px] md:h-[420px] object-contain"
              />
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-slate-300">Scanned & Marked Present:</span>
                <span className="font-bold text-white text-lg">{liveAttendanceRecords.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Faculty Banner ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-xl font-bold shadow-inner">
            {profile?.firstName?.charAt(0) || user?.firstName?.charAt(0) || 'F'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight">
                {profile?.firstName || user?.firstName} {profile?.lastName || user?.lastName}
              </h1>
              <Badge variant="indigo" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                Faculty Member
              </Badge>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Employee ID: <span className="font-mono text-indigo-200">{profile?.employeeId || 'FACULTY'}</span> • Department: <span className="text-indigo-200 font-medium">{profile?.department?.name || 'Academic'}</span>
            </p>
          </div>
        </div>

        {activeSessionsList.length > 0 && step !== 5 && (
          <div className="bg-amber-500/20 border border-amber-400/30 rounded-xl p-3 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-300 animate-pulse" />
            <div>
              <p className="text-xs font-semibold text-amber-200">Active Session Running</p>
              <button
                onClick={() => resumeSession(activeSessionsList[0])}
                className="text-xs text-white underline hover:text-amber-300 font-medium mt-0.5 inline-block"
              >
                Resume Active Session →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Interactive Workflow Progress Bar ───────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto text-xs font-medium scrollbar-none py-0.5">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              step === 1 ? 'bg-indigo-600 text-white shadow-sm font-semibold' : step > 1 ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">1</span>
            1. Program
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <button
            onClick={() => selectedProgram && setStep(2)}
            disabled={!selectedProgram}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              step === 2 ? 'bg-indigo-600 text-white shadow-sm font-semibold' : step > 2 ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-400 disabled:opacity-50'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">2</span>
            2. Subject
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <button
            onClick={() => selectedSubject && setStep(3)}
            disabled={!selectedSubject}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              step === 3 ? 'bg-indigo-600 text-white shadow-sm font-semibold' : step > 3 ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-400 disabled:opacity-50'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">3</span>
            3. Section
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <button
            onClick={() => selectedSection && setStep(4)}
            disabled={!selectedSection}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              step === 4 ? 'bg-indigo-600 text-white shadow-sm font-semibold' : step > 4 ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-400 disabled:opacity-50'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">4</span>
            4. Students & Config
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <button
            disabled={!activeSession}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              step === 5 ? 'bg-indigo-600 text-white shadow-sm font-semibold' : step > 5 ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-400 disabled:opacity-50'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">5</span>
            5. QR Code & Live
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          <button
            disabled={!completedSummary}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors shrink-0 ${
              step === 6 ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 disabled:opacity-50'
            }`}
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">6</span>
            6. Complete
          </button>
        </div>
      </div>

      {/* ── STEP 1: SELECT PROGRAM ────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1: Select Program</h2>
              <p className="text-xs text-slate-500">Choose from your assigned academic programs</p>
            </div>
          </div>

          {groupedPrograms.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-semibold text-slate-700">No Teaching Assignments Found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Contact your HOD to assign programs, subjects, and sections to your profile.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedPrograms.map((prog) => (
                <button
                  key={prog.programId}
                  onClick={() => handleSelectProgram(prog)}
                  className={`text-left p-5 bg-white border rounded-xl hover:shadow-lg transition-all group relative flex flex-col justify-between ${
                    selectedProgram?.programId === prog.programId ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <Badge variant={prog.isActive ? 'success' : 'error'}>
                        {prog.programCode}
                      </Badge>
                    </div>

                    <p className="font-bold text-slate-800 text-base">{prog.programName}</p>

                    <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>Duration:</span>
                        <span className="font-semibold text-slate-700">{prog.durationYears} Years</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Academic Years:</span>
                        <span className="font-semibold text-slate-700">{prog.academicYears?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Select Program & View Subjects</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── STEP 2: SELECT SUBJECT ────────────────────────────────────────────── */}
      {step === 2 && selectedProgram && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 2: Select Subject for {selectedProgram.programName}
              </h2>
              <p className="text-xs text-slate-500">Select the subject you are taking today</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Programs
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {selectedProgram.academicYears?.flatMap((year) =>
              year.sections?.flatMap((sec) =>
                (sec.subjects || []).map((sub) => ({
                  ...sub,
                  year,
                  sec,
                }))
              )
            ).map((item, idx) => (
              <button
                key={`${item.subjectId}-${item.sec?.sectionId || idx}`}
                onClick={() => handleSelectSubject(item, item.year)}
                className="text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                  </div>
                  <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                    {item.subjectCode}
                  </span>
                </div>

                <p className="font-bold text-slate-800 text-base">{item.subjectName}</p>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Year & Semester:</span>
                    <span className="font-semibold text-slate-700">Year {item.year?.yearNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Section:</span>
                    <span className="font-semibold text-slate-700">Section {item.sec?.sectionName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits:</span>
                    <span className="font-semibold text-slate-700">{item.credits} Credits</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                  <span>Select Subject</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 3: SELECT SECTION ────────────────────────────────────────────── */}
      {step === 3 && selectedProgram && selectedSubject && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Step 3: Select Section for {selectedSubject.subjectName}
              </h2>
              <p className="text-xs text-slate-500">Choose the class section for attendance session</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Back to Subjects
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {selectedProgram.academicYears?.flatMap((year) =>
              year.sections
                ?.filter((sec) => sec.subjects?.some((s) => s.subjectId === selectedSubject.subjectId))
                .map((sec) => (
                  <button
                    key={sec.sectionId}
                    onClick={() => handleSelectSection(sec)}
                    className="text-left p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Grid className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-xs text-slate-400 font-medium">
                        Capacity: {sec.capacity || 'Unspecified'}
                      </span>
                    </div>

                    <p className="font-bold text-slate-900 text-lg">Section {sec.sectionName}</p>
                    <p className="text-xs text-slate-500 mt-1">Year {year.yearNumber}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                      <span>View Students & Configure</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))
            )}
          </div>
        </div>
      )}

      {/* ── STEP 4: VIEW STUDENTS & CONFIGURE SESSION ──────────────────────────── */}
      {step === 4 && selectedSection && selectedSubject && (
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Step 4: Section {selectedSection.sectionName} Students & Session Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Program: <strong className="text-slate-700">{selectedProgram?.programName}</strong> • Subject: <strong className="text-slate-700">{selectedSubject?.subjectName}</strong>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Change Section
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Enrolled Section Students & Class Overview */}
            <div className="lg:col-span-2 space-y-4">
              {/* Class Overview Tag Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                  <span className="text-slate-400 font-medium">Program</span>
                  <p className="font-bold text-slate-800 truncate mt-0.5">{selectedProgram?.programCode || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                  <span className="text-slate-400 font-medium">Academic Year</span>
                  <p className="font-bold text-slate-800 mt-0.5">Year {selectedAcademicYear?.yearNumber || 1}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                  <span className="text-slate-400 font-medium">Subject Code</span>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedSubject?.subjectCode || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs">
                  <span className="text-slate-400 font-medium">Class Section</span>
                  <p className="font-bold text-indigo-600 mt-0.5">Section {selectedSection?.sectionName}</p>
                </div>
              </div>

              {/* Students Table / Directory Card */}
              <Card>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-sm">Enrolled Section Students</h3>
                  </div>
                  <Badge variant="indigo">{sectionStudents.length} Students</Badge>
                </div>

                <CardContent className="p-0">
                  {loadingStudents ? (
                    <Loader message="Loading section students..." className="py-10" />
                  ) : sectionStudents.length === 0 ? (
                    <div className="p-10 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">No Students Enrolled in Section {selectedSection.sectionName}</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                          There are currently no active student accounts enrolled in this section. Students can be enrolled via the Students tab or HOD management.
                        </p>
                      </div>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-indigo-600 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> You can still start the session and generate the temporary QR code.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                      {sectionStudents.map((st, idx) => (
                        <div key={st.id || idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {st.user?.firstName?.[0] || st.firstName?.[0] || 'S'}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{st.user?.firstName || st.firstName} {st.user?.lastName || st.lastName}</p>
                              <p className="text-slate-400 text-[11px]">{st.user?.email || st.email}</p>
                            </div>
                          </div>
                          <div className="text-right font-mono text-slate-600">
                            <div>Roll: <strong className="text-slate-800">{st.rollNumber || '—'}</strong></div>
                            <div className="text-[10px] text-slate-400">{st.enrollmentNumber || ''}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right: Manual Session Configuration Form */}
            <div className="space-y-4">
              <Card title="Start Attendance Session" subtitle="Configure manual time, duration & GPS parameters">
                <form onSubmit={handleStartSession} className="space-y-4">
                  {/* Session Type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Session Type
                    </label>
                    <select
                      value={sessionConfig.sessionType}
                      onChange={(e) => setSessionConfig({ ...sessionConfig, sessionType: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="REGULAR">Regular Lecture</option>
                      <option value="LAB">Practical / Lab Session</option>
                      <option value="REVISION">Revision / Extra Class</option>
                      <option value="TUTORIAL">Tutorial</option>
                    </select>
                  </div>

                  {/* Manual Date & Time Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Session Date
                      </label>
                      <input
                        type="date"
                        required
                        value={sessionConfig.sessionDate}
                        onChange={(e) => setSessionConfig({ ...sessionConfig, sessionDate: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                        Start Time
                      </label>
                      <input
                        type="time"
                        required
                        value={sessionConfig.startTime}
                        onChange={(e) => setSessionConfig({ ...sessionConfig, startTime: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm bg-white font-medium text-slate-900 focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                  </div>

                  {/* Manual QR Session Duration (Minutes) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      QR Session Duration (Minutes)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="360"
                        required
                        value={sessionConfig.durationMinutes}
                        onChange={(e) => setSessionConfig({ ...sessionConfig, durationMinutes: Math.max(1, Number(e.target.value)) })}
                        className="w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white font-bold text-slate-900 focus:ring-2 focus:ring-indigo-200"
                        placeholder="e.g. 15"
                      />
                      <span className="text-xs font-medium text-slate-500 whitespace-nowrap">mins</span>
                    </div>

                    {/* Quick Preset Duration Chips */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setSessionConfig({ ...sessionConfig, durationMinutes: mins })}
                          className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                            sessionConfig.durationMinutes === mins
                              ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Working GPS Geofence Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                        <Compass className="w-4 h-4 text-indigo-600" />
                        GPS Geofence Verification
                      </label>
                      <input
                        type="checkbox"
                        checked={sessionConfig.enableGps}
                        onChange={(e) => handleToggleGps(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-400 cursor-pointer"
                      />
                    </div>

                    {sessionConfig.enableGps && (
                      <div className="space-y-3 pt-2 border-t border-slate-200/80">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={detectCurrentLocation}
                          isLoading={detectingLocation}
                          className="text-xs flex items-center gap-1.5 w-full justify-center bg-white"
                        >
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          {sessionConfig.latitude ? 'Re-Detect GPS Location' : 'Detect Classroom GPS Location'}
                        </Button>

                        {sessionConfig.latitude && sessionConfig.longitude ? (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold">GPS Location Active</p>
                              <p className="font-mono text-[11px] text-emerald-700 mt-0.5">
                                Lat: {Number(sessionConfig.latitude).toFixed(5)}, Lng: {Number(sessionConfig.longitude).toFixed(5)}
                                {sessionConfig.accuracy ? ` (±${Math.round(sessionConfig.accuracy)}m)` : ''}
                              </p>
                            </div>
                          </div>
                        ) : locationError ? (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                            {locationError}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Click above to fetch your classroom coordinates so students must be physically present inside the room to scan.
                          </p>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Allowed Radius (Meters)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="5"
                              max="2000"
                              value={sessionConfig.allowedRadius}
                              onChange={(e) => setSessionConfig({ ...sessionConfig, allowedRadius: Number(e.target.value) })}
                              className="w-full rounded border border-slate-300 p-1.5 text-xs bg-white font-mono"
                              placeholder="100"
                            />
                            <span className="text-xs text-slate-500">meters</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg"
                    isLoading={creatingSession}
                    leftIcon={<Play className="w-4 h-4 fill-white" />}
                  >
                    Start Session & Show QR Code
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: LIVE QR CODE & ATTENDANCE MONITORING ─────────────────────── */}
      {step === 5 && activeSession && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h2 className="text-lg font-bold text-slate-900">Attendance Session Active</h2>
                <Badge variant="success">LIVE</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSession.subject?.name || selectedSubject?.subjectName} • Section {activeSession.section?.name || selectedSection?.sectionName}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreenQr(true)}
                leftIcon={<Maximize2 className="w-4 h-4" />}
              >
                Project QR
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => finishSession(activeSession?.id)}
                isLoading={closingSession}
                leftIcon={<StopCircle className="w-4 h-4" />}
              >
                End Session
              </Button>
            </div>
          </div>

          {/* Live KPI Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox
              icon={Users}
              label="Total Enrolled"
              value={liveSummary?.totalStudents ?? sectionStudents.length ?? 0}
              color="indigo"
            />
            <StatBox
              icon={CheckCircle2}
              label="Present"
              value={liveSummary?.presentCount ?? liveAttendanceRecords.length ?? 0}
              color="emerald"
            />
            <StatBox
              icon={XCircle}
              label="Absent"
              value={liveSummary?.absentCount ?? Math.max(0, (liveSummary?.totalStudents || sectionStudents.length) - liveAttendanceRecords.length)}
              color="rose"
            />
            <StatBox
              icon={Award}
              label="Attendance %"
              value={liveSummary?.attendancePercentage != null ? `${liveSummary.attendancePercentage}%` : `${Math.round((liveAttendanceRecords.length / Math.max(1, sectionStudents.length)) * 100)}%`}
              color="violet"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dynamic QR Code Card */}
            <Card title="Dynamic QR Code" subtitle="Students scan this code using their mobile app">
              <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-2xl text-white space-y-4">
                {/* Timer Box */}
                <div className="flex items-center gap-2 bg-indigo-500/30 border border-indigo-400/40 px-4 py-1.5 rounded-full">
                  <Clock className="w-4 h-4 text-amber-300 animate-spin" />
                  <span className="text-xs text-slate-200">Time Remaining:</span>
                  <span className="text-lg font-mono font-bold text-amber-300">{formatTime(timeLeftSeconds)}</span>
                </div>

                {/* QR Image */}
                <div className="p-4 bg-white rounded-2xl shadow-2xl">
                  {qrCodeData ? (
                    <img src={qrCodeData} alt="Attendance QR Code" className="w-64 h-64 sm:w-72 sm:h-72 object-contain" />
                  ) : (
                    <div className="w-64 h-64 flex items-center justify-center text-slate-400">Generating QR...</div>
                  )}
                </div>

                {/* Raw payload copy fallback */}
                <div className="w-full text-center">
                  <button
                    onClick={copyQrPayloadToClipboard}
                    className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-100 bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPayload ? 'Copied QR Payload!' : 'Copy Payload (Manual Fallback)'}</span>
                  </button>
                </div>
              </div>
            </Card>

            {/* Live Student Scans List */}
            <Card
              title="Live Student Scans"
              subtitle={`Polling every 3 seconds (${liveAttendanceRecords.length} marked present)`}
            >
              {liveAttendanceRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <QrCode className="w-12 h-12 mx-auto mb-3 opacity-30 animate-pulse" />
                  <p className="text-sm font-medium">Waiting for students to scan...</p>
                  <p className="text-xs text-slate-400 mt-1">Scanned attendance will appear here live.</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
                  {liveAttendanceRecords.map((rec) => (
                    <div key={rec.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">{rec.studentName}</p>
                        <p className="text-[11px] text-slate-400">Roll: {rec.rollNumber} • {rec.email}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> PRESENT
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {rec.markedAt ? new Date(rec.markedAt).toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── STEP 6: SESSION SUMMARY & PERMANENT RECORD ───────────────────────── */}
      {step === 6 && completedSummary && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <h2 className="text-xl font-bold">Attendance Session Completed & Saved</h2>
              </div>
              <p className="text-xs text-emerald-200 mt-1">
                Data saved permanently in PostgreSQL. Summary report generated.
              </p>
            </div>

            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => {
                setStep(1);
                setActiveSession(null);
                setCompletedSummary(null);
              }}
              leftIcon={<Play className="w-4 h-4 fill-white" />}
            >
              Start Another Session
            </Button>
          </div>

          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatBox
              icon={Users}
              label="Total Section Students"
              value={completedSummary.summary?.totalStudents ?? completedSummary.records?.length ?? 0}
              color="indigo"
            />
            <StatBox
              icon={CheckCircle2}
              label="Present Students"
              value={completedSummary.summary?.presentCount ?? completedSummary.records?.filter((r) => r.status === 'PRESENT').length ?? 0}
              color="emerald"
            />
            <StatBox
              icon={XCircle}
              label="Absent Students"
              value={completedSummary.summary?.absentCount ?? 0}
              color="rose"
            />
            <StatBox
              icon={Award}
              label="Overall Attendance %"
              value={`${completedSummary.summary?.attendancePercentage ?? 0}%`}
              color="violet"
            />
          </div>

          {/* Full Student Attendance Records Table */}
          <Card title="Attendance Records" subtitle="Permanent attendance log stored in PostgreSQL">
            <CardContent className="p-0">
              <Table
                columns={[
                  {
                    header: 'Student Name',
                    render: (row) => (
                      <div>
                        <div className="font-semibold text-slate-900">{row.studentName}</div>
                        <div className="text-xs text-slate-400">{row.email}</div>
                      </div>
                    ),
                  },
                  {
                    header: 'Status',
                    render: (row) =>
                      row.status === 'PRESENT' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" /> ABSENT
                        </span>
                      ),
                  },
                  {
                    header: 'Marked At',
                    render: (row) => row.markedAt ? new Date(row.markedAt).toLocaleTimeString() : '—',
                  },
                ]}
                data={completedSummary.records || []}
                emptyMessage={<EmptyState icon={FileText} title="No Records" message="No attendance records logged for this session." />}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
