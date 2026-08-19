function errorHandler(err, req, res, next) {
  console.error('[Error Middleware]', err);
  res.status(err.status || 500).json({
    success: false,
    status: 'error',
    message: err.message || 'Error interno del servidor'
  });
}

module.exports = errorHandler;
