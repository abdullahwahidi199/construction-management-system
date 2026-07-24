export function logError(...args) {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
}

export function logDebug(...args) {
  if (import.meta.env.DEV) {
    console.debug(...args);
  }
}

