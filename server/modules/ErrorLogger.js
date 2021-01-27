/**
 * Log an error
 * @param {Error} error The error object
 * @param {string} message Message explaining the reason for the error
 */
export function logError(error, message = "") {
  const line = Array(100).fill("-").join("");
  const txt = `\n${line}\n${message || "No message provided"}\n${line}\n> ${error.stack}\n${line}`;
  console.error(txt);
}
