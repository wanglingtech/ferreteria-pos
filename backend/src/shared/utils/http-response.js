function sendSuccess(res, data, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    ok: true,
    message,
    data,
  });
}

module.exports = { sendSuccess };
