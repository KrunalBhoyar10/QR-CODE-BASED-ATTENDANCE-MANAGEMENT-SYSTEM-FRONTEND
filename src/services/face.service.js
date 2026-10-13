/**
 * face.service.js
 *
 * Wraps face-api.js to provide:
 *   - Lazy model loading (loads once, cached)
 *   - Face detection from a video/canvas element
 *   - 128-d face descriptor extraction
 *   - Descriptor comparison (Euclidean distance)
 *
 * Models are served from /public/models (Vite serves public/ at root).
 *
 * SECURITY NOTE:
 *   The descriptor is sent to the backend for final comparison.
 *   The frontend never decides pass/fail — it only extracts and transmits.
 */
import * as faceapi from 'face-api.js';

const MODELS_URL = '/models';
const MATCH_THRESHOLD = 0.55; // Euclidean distance — lower = stricter

let modelsLoaded = false;
let loadingPromise = null;

/**
 * Load all required face-api.js models exactly once.
 * Subsequent calls return the cached promise immediately.
 */
export async function loadModels() {
  if (modelsLoaded) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
  ]).then(() => {
    modelsLoaded = true;
  });

  return loadingPromise;
}

/**
 * Detect a single face and extract its 128-d descriptor from a
 * HTMLVideoElement, HTMLCanvasElement, or HTMLImageElement.
 *
 * @param {HTMLVideoElement|HTMLCanvasElement|HTMLImageElement} source
 * @returns {Float32Array|null}  descriptor or null if no face found
 */
export async function extractDescriptor(source) {
  await loadModels();

  const detection = await faceapi
    .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;
  return detection.descriptor; // Float32Array(128)
}

/**
 * Capture the current video frame on a canvas and extract a face descriptor.
 * Throws if no face is found.
 */
export async function captureAndExtract(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width  = videoEl.videoWidth  || 640;
  canvas.height = videoEl.videoHeight || 480;
  canvas.getContext('2d').drawImage(videoEl, 0, 0);
  const descriptor = await extractDescriptor(canvas);
  return descriptor;
}

/**
 * Extract a face descriptor from a File / Blob object (uploaded image).
 */
export async function extractDescriptorFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const img = new Image();
        img.onload = async () => {
          const descriptor = await extractDescriptor(img);
          resolve(descriptor);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Euclidean distance between two descriptors.
 * < MATCH_THRESHOLD → same person
 */
export function compareDescriptors(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Returns true when two descriptors belong to the same person.
 */
export function isSamePerson(a, b) {
  return compareDescriptors(a, b) < MATCH_THRESHOLD;
}

/**
 * Serialize Float32Array to a plain JS array for JSON transport.
 */
export function serializeDescriptor(descriptor) {
  if (!descriptor) return null;
  return Array.from(descriptor);
}

/**
 * Deserialize a plain array back to Float32Array.
 */
export function deserializeDescriptor(arr) {
  if (!arr) return null;
  return new Float32Array(arr);
}
