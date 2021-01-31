import { getSystemInformation } from "../db/database.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";

/**
 * @apiDefine AccessLoggedIn Logged user access only
 * The user has to be logged in the use this endpoint (see Authentication)
 */

/**
 * @apiDefine ErrorBadRequest
 * @apiError (400) BadRequest Bad request body / parameters
 */

/**
 * @apiDefine ErrorNotAllowed
 * @apiError (403) NotAllowed The current user is not allowed to do this.
 */

/**
 * @apiDefine ErrorServer
 * @apiError (500) ServerError Server-side error
 */

/**
 * @api {get} /status/ Get server status
 * @apiName GetServerStatus
 * @apiGroup Server
 *
 * @apiSuccess (200) {String} status Connection status to the server
 * @apiSuccess (200) {String} db_version Database date-based version (AAAA-MM-DD)
 */
function status(req, _res) {
  const res = new HttpResponseWrapper(_res);
  getSystemInformation("api_version")
    .then((version) => {
      const response = {
        status: "connected",
        apiVersion: version,
      };

      res.sendResponse(200, response);
    })
    .catch(res.sendServerError);
}

export default { status };
