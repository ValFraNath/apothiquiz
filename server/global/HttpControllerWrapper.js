import Logger from "./Logger.js";

/**
 * Class wrapping the response object
 */
export class HttpResponseWrapper {
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
    Logger.error(error);
    return this.sendResponse(500, { message: "Server side error" });
  }

  sendUsageError(status, message, body = {}) {
    return this.sendResponse(status, Object.assign(body, { message }));
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

export default (controller) => async (req, res, next) => {
  const wrappedResponse = new HttpResponseWrapper(res);
  try {
    await controller(req, wrappedResponse, next);
  } catch (e) {
    wrappedResponse.sendServerError(e);
  }
};
sss;
