// Cálculo horario Lima / Bogotá (UTC-5)
export function obtenerMinutosActualesLimaBogota() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  
  // Lima es UTC-5
  let limaHours = (utcHours - 5 + 24) % 24;
  return limaHours * 60 + utcMinutes;
}

// Variable para control de desbloqueo temporal
// TEMPORARY_LOCK_OVERRIDE = true: Desbloquea conteo (5:00 PM) y confirmación de llegada (4:50 PM).
// Cuando el usuario indique "vuelvelo a bloquear", se cambia a false para restablecer el bloqueo horario original.
export const TEMPORARY_LOCK_OVERRIDE = true;

// Validación de horario de conteo (5:00 PM a 5:00 AM)
export function isCountingTimeEnabled(currentUser = null, forceDisableLock = false) {
  if (TEMPORARY_LOCK_OVERRIDE || forceDisableLock) return true;
  
  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' || 
    currentUser.dni === '99999999' || 
    (currentUser.nombre || '').toLowerCase().includes('super admin')
  );
  if (isSuperAdmin) return true;

  const currentMinutes = obtenerMinutosActualesLimaBogota();
  // Habilitado desde las 5:00 PM (17:00 / 1020 mins) hasta las 5:00 AM (300 mins) del día siguiente
  return currentMinutes >= (17 * 60) || currentMinutes < (5 * 60);
}

// Validación de horario para el botón "Confirmar Llegada" (a partir de 4:50 PM / 16:50)
export function isLlegadaButtonUnlocked(currentUser = null, forceDisableLock = false) {
  if (TEMPORARY_LOCK_OVERRIDE || forceDisableLock) return true;

  const isSuperAdmin = currentUser && (
    currentUser.dni === 'Admin#2026$Secure!VotoReal' || 
    currentUser.dni === '99999999' || 
    (currentUser.nombre || '').toLowerCase().includes('super admin')
  );
  if (isSuperAdmin) return true;

  const currentMinutes = obtenerMinutosActualesLimaBogota();
  // 16:50 = 16 * 60 + 50 = 1010 minutos
  return currentMinutes >= 1010 || currentMinutes < (5 * 60);
}

// Fórmula Geodésica Haversine de Alta Precisión
export function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function extractJsonFromString(str) {
  if (!str) return null;
  const trimmed = str.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {}

  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = trimmed.match(codeBlockRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch (e) {}
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.substring(firstBrace, lastBrace + 1));
    } catch (e) {}
  }

  const firstBracket = trimmed.indexOf('[');
  const lastBracket = trimmed.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(trimmed.substring(firstBracket, lastBracket + 1));
    } catch (e) {}
  }

  return null;
}
