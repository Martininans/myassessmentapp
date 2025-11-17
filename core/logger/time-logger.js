 
const appLogger = require('./app-logger');

function start(label = 'process', meta = {}) {
  const startTime = process.hrtime.bigint();

  return {
    end(extraMeta = {}) {
      const elapsedNs = process.hrtime.bigint() - startTime;
      const durationMs = Number(elapsedNs) / 1e6;
      appLogger.info(`${label} completed`, {
        duration_ms: durationMs,
        ...meta,
        ...extraMeta
      });
    }
  };
}

module.exports = {
  start
};