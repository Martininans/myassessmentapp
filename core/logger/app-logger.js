 
function log(level, message, meta) {
  const timestamp = new Date().toISOString();
  const payload = {
    level,
    message,
    timestamp
  };

  if (meta && typeof meta === 'object') {
    payload.meta = meta;
  }

  const serialized = JSON.stringify(payload);

  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}

const appLogger = {
  info(message, meta) {
    log('info', message, meta);
  },
  warn(message, meta) {
    log('warn', message, meta);
  },
  error(message, meta) {
    log('error', message, meta);
  }
};

module.exports = appLogger;