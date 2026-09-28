function errorHandler(err, req, res, next) {
  console.error('[Error Middleware - Internal Stack]:', err);
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    status: 'error',
    message: isDev ? (err.message || 'Error interno del servidor') : 'Ha ocurrido un error en el servidor. Por favor intenta más tarde.'
  });
}

module.exports = errorHandler;

