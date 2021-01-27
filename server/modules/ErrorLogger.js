/**
 * Log an error
 * @param {Error} error
 * @param {string} message Message explaining the reason for the error
 */
function log(error, message = "") {
  const line = Array(100).fill("-").join("");
  const txt = `\n${line}\n${message || error.message || "No message provided"}\n${line}\n> ${error.stack}\n${line}\n`;
  console.error(txt);
}

export default { log };
