import { queryPromise } from "../db/database.js";

/**
 * Update the token of a user
 *
 * @api {put} /messaging/token/add
 * @apiName SaveUserToken
 * @apiGroup Messaging
 *
 * @apiParam {string} messaging The messaging token
 *
 * @apiSuccess (200) {object} New messaging token
 *
 * @apiParamExample {object} Request-Example:
 * {
 *   "user": "nhoun",
 *   "messagingToken": "cjFl5JjYiaUdFfxuKefa...iv9ViE6_m",
 * }
 *
 *
 * @apiUse ErrorServer
 * @apiError (400) InvalidUser The user is not valid
 * @apiError (400) InvalidToken The token is not valid
 * @apiError (404) NotFound User not found
 */
async function updateToken(req, res) {
  const { user, messagingToken } = req.body;
  if (!user) {
    return res.sendUsageError(400, "Missing user");
  }
  if (!messagingToken) {
    return res.sendUsageError(400, "Missing messaging token");
  }

  const isUpdated = await _saveMessagingTokenInDatabase(user, messagingToken);
  if (isUpdated) {
    res.sendResponse(200, {
      user: user,
      messagingToken: messagingToken,
    });
  } else {
    res.sendUsageError(404, "User not found");
  }
}

/**
 * Remove the token of a user
 *
 * @api {put} /messaging/token/remove
 * @apiName RemoveUserToken
 * @apiGroup Messaging
 *
 * @apiSuccess (200) {object} New messaging token
 *
 * @apiParamExample {object} Request-Example:
 * {
 *   "user": "nhoun",
 * }
 *
 *
 * @apiUse ErrorServer
 * @apiError (400) InvalidUser The user is not valid
 * @apiError (400) InvalidToken The token is not valid
 * @apiError (404) NotFound User not found
 */
async function removeToken(req, res) {
  const { user } = req.body;
  if (!user) {
    return res.sendUsageError(400, "Missing user");
  }

  const isUpdated = _saveMessagingTokenInDatabase(user);
  if (isUpdated) {
    res.sendResponse(200, {
      user: user,
      messagingToken: "NULL",
    });
  } else {
    res.sendUsageError(404, "User not found");
  }
}

export default { updateToken, removeToken };

// ***** INTERNAL FUNCTIONS *****

/**
 * Update the token of a user (add / remove)
 */
function _saveMessagingTokenInDatabase(user, messagingToken = undefined) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE user
                 SET us_messaging_token = ${messagingToken ? "?" : "NULL"}
                 WHERE us_login = ?`;
    const arrayOfValues = messagingToken ? [messagingToken, user] : [user];
    queryPromise(sql, arrayOfValues)
      .then((res) => resolve(res.affectedRows === 1))
      .catch((error) => reject(error));
  });
}
