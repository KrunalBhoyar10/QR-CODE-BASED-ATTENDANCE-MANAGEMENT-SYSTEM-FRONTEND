/**
 * FaceRegistration.jsx
 *
 * Used on the Student Profile page.
 * Shows current face photo, change count (0/2), teacher-auth badge,
 * and lets the student register or replace their face photo.
 *
 * Props:
 *   onSuccess()  — called after a successful upload
 */
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Camera, AlertTriangle, CheckCircle2,
  RefreshCw, Loader2, Lock, Info, UserCheck,
} from 'lucide-react';
import { Button }   from './ui/Button';
import { Modal }    from './ui/Modal';
import FaceCapture  from './FaceCapture';
import studentService from '../services/student.service.js';
import { serializeDescriptor } from '../services/face.service.js';
import { getErrorMessage } from '../utils/error.js';

// Build an absolute URL to a backend-served file (uploads, etc.)
const backendUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already absolute
  const base = import.meta.env.VITE_API_BASE_URL || '';
  if (base.startsWith('http')) {
    // Full URL like http://localhost:5000/api/v1 → strip to get origin
    const origin = base.replace(/\/api\/v\d+\/?$/, '');
    return `${origin}${path}`;
  }
  // Relative base like /api/v1 → same origin as the page (proxy handles it)
  return path;
};

export default function FaceRegistration({ onSuccess }) {
  const [status, setStatus]     = useState(null);  // { hasPhoto, changeCount, changeLimit, teacherAuthorized, facePhotoUrl }
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modalOpen, setModal]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await studentService.getFaceStatus();
      // Merge with any localStorage teacher authorization (set by teacher dashboard)
      const overrides = (() => {
        try { return JSON.parse(localStorage.getItem('face_auth_overrides') || '{}'); }
        catch { return {}; }
      })();
      const userId = data?.studentId || data?.id;
      if (userId && overrides[userId]) {
        data.teacherAuthorized = true;
      }
      setStatus(data);
    } catch (e) {
      // If endpoint doesn't exist yet, show a graceful placeholder
      if (e?.response?.status === 404 || e?.response?.status === 501) {
        // Check localStorage for teacher authorization
        const overrides = (() => {
          try { return JSON.parse(localStorage.getItem('face_auth_overrides') || '{}'); }
          catch { return {}; }
        })();
        // We don't have the studentId here — allow change if ANY override exists
        // (will be refined once backend is available)
        setStatus({ hasPhoto: false, changeCount: 0, changeLimit: 2, teacherAuthorized: false, facePhotoUrl: null, _notImplemented: true });
      } else {
        setError(getErrorMessage(e, 'Failed to load face registration status.'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const canChange = status
    ? !status.hasPhoto || status.changeCount < status.changeLimit || status.teacherAuthorized
    : false;

  const handleCaptureDone = async ({ descriptor, imageDataUrl }) => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      // Convert dataUrl to Blob
      const res   = await fetch(imageDataUrl);
      const blob  = await res.blob();
      const file  = new File([blob], 'face_photo.jpg', { type: 'image/jpeg' });

      const formData = new FormData();
      formData.append('facePhoto', file);
      formData.append('faceDescriptor', JSON.stringify(serializeDescriptor(descriptor)));

      if (!status?.hasPhoto) {
        await studentService.registerFace(formData);
        setSaveSuccess('Face registered successfully!');
      } else {
        await studentService.updateFace(formData);
        setSaveSuccess('Face photo updated successfully!');
      }

      setModal(false);
      await fetchStatus();
      if (onSuccess) onSuccess();
    } catch (e) {
      setSaveError(getErrorMessage(e, 'Failed to save face photo. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading face registration status…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-rose-800">Error</p>
          <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          <button onClick={fetchStatus} className="text-xs text-rose-700 underline mt-1">Retry</button>
        </div>
      </div>
    );
  }

  const changesMade  = status?.changeCount ?? 0;
  const changeLimit  = status?.changeLimit ?? 2;
  const remaining    = Math.max(0, changeLimit - changesMade);
  const teacherAuth  = status?.teacherAuthorized ?? false;
  const limitReached = changesMade >= changeLimit && !teacherAuth;

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-start gap-4">
        {/* Photo preview or placeholder */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 flex items-center justify-center">
          {status?.facePhotoUrl ? (
            <img
              src={backendUrl(status.facePhotoUrl)}
              alt="Registered face"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-8 h-8 text-slate-300" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Registration status badge */}
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
            status?.hasPhoto
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {status?.hasPhoto
              ? <><CheckCircle2 className="w-3.5 h-3.5" /> Face Registered</>
              : <><AlertTriangle className="w-3.5 h-3.5" /> Not Registered</>
            }
          </div>

          {/* Change count */}
          {status?.hasPhoto && (
            <p className="text-xs text-slate-500 mt-1.5">
              Photo changes: <span className="font-semibold text-slate-700">{changesMade} / {changeLimit}</span>
              {remaining > 0 && !teacherAuth && (
                <span className="text-slate-400"> ({remaining} remaining)</span>
              )}
            </p>
          )}

          {/* Teacher-authorized badge */}
          {teacherAuth && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              <UserCheck className="w-3.5 h-3.5" />
              Teacher authorized — 1 change allowed
            </div>
          )}
        </div>
      </div>

      {/* Success / error messages */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{saveSuccess}
        </div>
      )}
      {saveError && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{saveError}
        </div>
      )}

      {/* Limit reached message */}
      {limitReached && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Photo Change Limit Reached</p>
            <p className="text-xs text-amber-700 mt-0.5">
              You have reached your photo change limit ({changeLimit} changes).
              Please contact your teacher to authorize one additional change.
            </p>
          </div>
        </div>
      )}

      {/* Info note */}
      {!status?.hasPhoto && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-start gap-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            Register your face photo to enable face verification during QR attendance scanning.
            Your face data is stored securely and only used for identity verification.
          </p>
        </div>
      )}

      {/* Action button */}
      {canChange && (
        <Button
          onClick={() => { setSaveError(''); setSaveSuccess(''); setModal(true); }}
          leftIcon={<Camera className="w-4 h-4" />}
          variant={status?.hasPhoto ? 'outline' : 'primary'}
          className="w-full sm:w-auto"
        >
          {status?.hasPhoto ? 'Update Face Photo' : 'Register Face Photo'}
        </Button>
      )}

      {/* Face capture modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModal(false)}
        title={status?.hasPhoto ? 'Update Face Photo' : 'Register Face Photo'}
        description="Look directly at the camera with good lighting. Remove glasses or hats if possible."
        size="md"
      >
        {saving ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-600">Saving face photo…</p>
          </div>
        ) : (
          <FaceCapture
            onCapture={handleCaptureDone}
            onCancel={() => setModal(false)}
            onError={(msg) => setSaveError(msg)}
            compact={false}
          />
        )}
      </Modal>
    </div>
  );
}
