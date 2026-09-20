export function errorHandler(err, req, res, next) {
  console.error(err)

  // Multer file-size errors have a recognizable code.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File is too large.' })
  }

  // Never expose internal error messages, stack traces, or SQL details to
  // the client — that information is exactly what an attacker wants.
  res.status(err.status || 500).json({
    message: err.publicMessage || 'Something went wrong. Please try again.',
  })
}
