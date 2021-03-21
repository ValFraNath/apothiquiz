import { getSystemInformation } from "../db/database.js";

/**
 * @apiDefine LoggedIn Logged user access only
 * The user has to be logged in to use this endpoint (see Authentication)
 */

/**
 * @apiDefine Admin Admin users only
 * The user has to be admin to use this endpoint
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
 *
 * @param {HttpResponseWrapper} res The http response
 */
async function status(_, res) {
  const version = await getSystemInformation("api_version");
  const response = {
    status: "connecté",
    apiVersion: version,
  };

  res.sendResponse(200, response);
}

export default { status };
