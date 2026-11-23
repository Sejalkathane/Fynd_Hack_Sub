class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;   // HTTP status, e.g. 400, 404, 409
    this.code = code;       // machine-readable, e.g. "INSUFFICIENT_STOCK"
    this.details = details; // optional extra info
  }
}

module.exports = { AppError };