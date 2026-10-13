/**
 * Normalize and validate WGS84 coordinates (fixes common lat/lng swap).
 */
export const normalizeLatLng = (lat, lng) => {
  let latitude = Number(lat);
  let longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  if (Math.abs(latitude) > 90 && Math.abs(longitude) <= 90) {
    [latitude, longitude] = [longitude, latitude];
  }

  // India-ish heuristic: lng stored in lat field
  if (latitude >= 68 && latitude <= 97 && longitude >= 8 && longitude <= 37) {
    [latitude, longitude] = [longitude, latitude];
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  if (latitude === 0 && longitude === 0) return null;

  return { latitude, longitude };
};

export const isValidCoordinatePair = (lat, lng) => normalizeLatLng(lat, lng) != null;

/** Payload fields some backends expect */
export const coordsToApiFields = (lat, lng, accuracy) => {
  const norm = normalizeLatLng(lat, lng);
  if (!norm) return null;
  return {
    latitude: norm.latitude,
    longitude: norm.longitude,
    lat: norm.latitude,
    lng: norm.longitude,
    ...(accuracy != null ? { accuracy: Number(accuracy) } : {}),
  };
};
