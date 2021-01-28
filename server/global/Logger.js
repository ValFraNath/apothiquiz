/**
 * Log an error
 * @param {Error} error The error object
 * @param {string} title Message explaining the reason for the error
 */
function error(error, title) {
  const line = Array(100).fill("-").join("");
  const txt = `\n${line}\n${formatDate()} | ${
    error.title || title || "No message provided"
  }\n${line}\n> ${error.stack}\n${line}`;
  console.error(txt);
}

/**
 * Log an information
 * @param  {...any} messages Messages to log
 */
function info(...messages) {
  console.info(...messages);
}

/**
 * Log a debugging message
 * @param  {...any} messages Messages to log
 */
function debug(...messages) {
  if (process.NODE_ENV !== "production") {
    console.debug(...messages);
  }
}

export default { error, info, debug };

/**
 * Format the current date
 */
function formatDate() {
  const date = new Date();
  return `${forceTwoDigit(date.getDay())}/${forceTwoDigit(
    date.getMonth() + 1
  )}/${date.getFullYear()} - ${forceTwoDigit(date.getHours())}:${forceTwoDigit(
    date.getMinutes()
  )}:${forceTwoDigit(date.getSeconds())}`;
}

/**
 * Force a number to contains to digit
 * @param {string} number
 */
const forceTwoDigit = (number) => ("0" + number).slice(-2);

/**
 * Add a title to an existing error to set the context.
 * N.B. If the error already contains a title, it does not change.
 * @param {Error} error The error
 * @param {string} title The title
 */
export function addErrorTitle(error, title) {
  if (!error.title) {
    error.title = title;
  }
  return error;
}
