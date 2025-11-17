 
class AppError extends Error {
  constructor({ message, status = 400, code, data } = {}) {
    super(message || 'Application error');
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.data = data;
    this.isAppError = true;
  }
}

module.exports = AppError;