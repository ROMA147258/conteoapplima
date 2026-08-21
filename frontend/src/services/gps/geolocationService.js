import { COLEGIOS_GPS_MAP } from '../../constants/data';
import { calcularDistanciaMetros } from '../../utils/helpers';

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
          console.warn('[GPS Service] Error capturando posición:', err.message);
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

export function obtenerCoordenadasMesaColegio(mesaNum, colegioNombre, distrito, mesasEstructura = []) {
  const cleanMesa = (mesaNum || '').toString().trim().replace(/\D/g, '');
  const paddedMesa = cleanMesa.padStart(6, '0');

  // 1. Buscar en mesasEstructura por número de mesa
  if (Array.isArray(mesasEstructura)) {
    const foundMesa = mesasEstructura.find(m => {
      const num = (m.mesa || m.numero_mesa || '').toString().trim().replace(/\D/g, '');
      return (num === cleanMesa || num === paddedMesa) && (m.latitud || m.lat);
    });
    if (foundMesa && (foundMesa.latitud || foundMesa.lat)) {
      const lat = parseFloat(foundMesa.latitud || foundMesa.lat);
      const lon = parseFloat(foundMesa.longitud || foundMesa.lon || foundMesa.lng);
      if (!isNaN(lat) && !isNaN(lon) && lat !== 0) {
        return { lat, lon, source: 'mesas_tabla' };
      }
    }

    // 2. Buscar en mesasEstructura por nombre de colegio
    if (colegioNombre) {
      const foundColegio = mesasEstructura.find(m => 
        m.colegio && m.colegio.toLowerCase().trim() === colegioNombre.toLowerCase().trim() && (m.latitud || m.lat)
      );
      if (foundColegio) {
        const lat = parseFloat(foundColegio.latitud || foundColegio.lat);
        const lon = parseFloat(foundColegio.longitud || foundColegio.lon || foundColegio.lng);
        if (!isNaN(lat) && !isNaN(lon) && lat !== 0) {
          return { lat, lon, source: 'mesas_colegio' };
        }
      }
    }
  }

  // 3. Fallback a colegios GPS o distrito
  return obtenerCoordenadasColegio(colegioNombre, distrito);
}

export { calcularDistanciaMetros };
