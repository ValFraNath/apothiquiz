import admin from "firebase-admin";

import { queryPromise } from "../db/database";
import saKey from "../files/serviceAccountKey.json";
import HttpResponseWrapper from "../global/HttpResponseWrapper";
import { addErrorTitle } from "../global/Logger";

/* Initialize firebase */
admin.initializeApp({
  credential: admin.credential.cert(saKey),
});

/**
 *
 * @api {patch} /messaging/token/
 * @apiName SaveUserToken
 * @apiGroup Messaging
 *
 * @apiParam {string} messaging The messaging token
 *
 * @apiSuccess (200) {string} New messaging token
 *
 * @apiParamExample {object} Request-Example:
 * {
 *   "user": "nhoun",
 *   "messagingToken": "cjFl5JjYiaUdFfxuKefa...iv9ViE6_m"
 * }
 *
 *
 * @apiUse ErrorServer
 * @apiError (400) InvalidUser The user is not valid
 * @apiError (400) InvalidToken The token is not valid
 */
export function updateToken(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const { user, messagingToken } = req.body;

  if (!user) {
    return res.sendUsageError(400, "Missing user");
  }
  if (!messagingToken) {
    return res.sendUsageError(400, "Missing messaging token");
  }

  saveMessagingTokenInDatabase()
    .then((res) => console.log("RES -->", res))
    .catch(res.sendServerError);
}

export function sendNotificationToOneDevice(targetToken, data) {
  const message = {
    data: data,
    token: targetToken,
  };

  admin
    .messaging()
    .send(message)
    .catch((err) => console.error("Can't send notification to a single device", err));
}

// ***** INTERNAL FUNCTIONS *****

function saveMessagingTokenInDatabase(user, messagingToken) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE user
                 SET us_messaging_token = ?
                 WHERE us_login = ?`;
    queryPromise(sql, [messagingToken, user])
      .then((res) => resolve(res))
      .catch((error) => reject(addErrorTitle(error, "Can't update messaging token", true)));
  });
}
