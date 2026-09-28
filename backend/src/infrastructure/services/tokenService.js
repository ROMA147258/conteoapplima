const crypto = require('crypto');
const env = require('../../config/env');

const JWT_SECRET = env.JWT_SECRET || process.env.JWT_SECRET || 'votoreal_lima_2026_super_secure_key_#7788';
const activeBlacklist = new Set();

/**
 * Token Service usando HMAC-SHA256 (estándar JWT sin dependencias externas)
 */
class TokenService {
  /**
   * Genera un token firmado con payload y expiración (12 horas por defecto)
   */
  generateToken(user, expiresInSeconds = 43200) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: user.dni || user.id || '99999999',
      nombre: user.nombre || '',
      rol: user.rol || 'Personero',
      ubicacion: user.ubicacion || user.distrito || '',
      colegio: user.colegio || '',
      mesa: user.mesa || '',
      iat: now,
      exp: now + expiresInSeconds,
      jti: crypto.randomBytes(16).toString('hex')
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  /**
   * Verifica un token firmado y retorna el payload o null
   */
  verifyToken(token) {
    if (!token || typeof token !== 'string') return null;

    if (activeBlacklist.has(token)) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    // Comparación en tiempo constante para mitigar timing attacks
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    try {
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expirado
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Invalida un token en el servidor al cerrar sesión
   */
  invalidateToken(token) {
    if (token) {
      activeBlacklist.add(token);
      // Limpieza automática tras 12 horas para evitar crecimiento de memoria
      setTimeout(() => {
        activeBlacklist.delete(token);
      }, 43200 * 1000);
    }
  }
}

module.exports = new TokenService();
