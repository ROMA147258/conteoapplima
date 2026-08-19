import { COLEGIOS_GPS_MAP } from '../constants/data';

export async function getRealGeolocationFast(timeoutMs = 6500) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    let hasResolved = false;
    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve(null);
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timer);
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            acc: Math.round(pos.coords.accuracy || 10)
          });
        }
      },
      (err) => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timer);
          console.warn('[GPS] Error capturando posición:', err.message);
          resolve(null);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 10000
      }
    );
  });
}

export function obtenerCoordenadasColegio(colegioNombre, distrito) {
  if (colegioNombre && COLEGIOS_GPS_MAP[colegioNombre]) {
    return COLEGIOS_GPS_MAP[colegioNombre];
  }

  // Coordenadas centrales por defecto de Lima Metropolitana
  const DISTRITO_DEFAULT_GPS = {
    'Ate': { lat: -12.0254, lon: -76.9189 },
    'Ancón': { lat: -11.7745, lon: -77.1550 },
    'Lima': { lat: -12.0463, lon: -77.0427 },
    'Miraflores': { lat: -12.1245, lon: -77.0260 },
    'San Isidro': { lat: -12.0970, lon: -77.0360 },
    'Santiago de Surco': { lat: -12.1400, lon: -76.9900 },
    'Surco': { lat: -12.1400, lon: -76.9900 }
  };

  return DISTRITO_DEFAULT_GPS[distrito] || { lat: -12.0463, lon: -77.0427 };
}
