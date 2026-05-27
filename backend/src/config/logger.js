const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export function log(level, message, data) {
  if (LOG_LEVELS[level] > LOG_LEVELS[CURRENT_LEVEL]) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data }),
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  error: (msg, data) => log('error', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  info: (msg, data) => log('info', msg, data),
  debug: (msg, data) => log('debug', msg, data),
};
