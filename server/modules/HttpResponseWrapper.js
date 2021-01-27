import { logError } from "./ErrorLogger.js";
/**
 * Class wrapping the response object
 */
export default class HttpResponseWrapper {
  constructor(res) {
    this.original = res;
    this.sendServerError = this.sendServerError.bind(this);
    this.sendUsageError = this.sendUsageError.bind(this);
    this.sendResponse = this.sendResponse.bind(this);
  }

  /**
   * Send the error
   * @param {Error|UsageError} error
   */
  sendServerError(error) {
    logError(error);
    return this.original.status(500).json({ message: "Server side error" });
  }

  sendUsageError(status, message, code) {
    return this.sendResponse(status, { message, code });
  }

  /**
   * Send the response
   * @param {number} status The response status
   * @param {object} body The response body
   */
  sendResponse(status, body = {}) {
    return this.original.status(Number(status) || 200).json(body);
  }
}
