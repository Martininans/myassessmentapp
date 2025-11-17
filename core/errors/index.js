 
const AppError = require('./app-error');

const ERROR_CODE = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RUNTIME_ERROR: 'RUNTIME_ERROR'
};

function createAppError({ message, status, code, data } = {}) {
  return new AppError({ message, status, code, data });
}

function throwAppError(message, options = {}) {
  const { status = 400, code, data } = options;
  throw new AppError({ message, status, code, data });
}

module.exports = {
  AppError,
  ERROR_CODE,
  createAppError,
  throwAppError
};