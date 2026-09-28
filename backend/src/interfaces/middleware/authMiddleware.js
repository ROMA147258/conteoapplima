const tokenService = require('../../infrastructure/services/tokenService');

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      status: 'unauthorized',
      message: 'Acceso no autorizado: Se requiere token de sesión activo'
    });
  }

  const user = tokenService.verifyToken(token);
  if (!user) {
    return res.status(401).json({
      success: false,
      status: 'unauthorized',
      message: 'Sesión inválida o expirada. Por favor inicia sesión nuevamente.'
    });
  }

  req.user = user;
  req.token = token;
  next();
}

// Middleware opcional para endpoints públicos/híbridos
function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token) {
    req.user = tokenService.verifyToken(token);
    req.token = token;
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
