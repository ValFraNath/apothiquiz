import fs from "fs";
import path from "path";

import admin from "firebase-admin";

import { queryPromise } from "../db/database.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import { addErrorTitle } from "../global/Logger.js";

/* Initialize firebase */
fs.readFile(
  path.resolve(fs.realpathSync("."), "./files/serviceAccountKey.json"),
  "utf-8",
  (err, data) => {
    if (err) {
      console.error("Can't read service account file.", err);
      return;
    }
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(data)),
    });
  }
);

/**
 *
 * @api {get} /messaging
 * @apiName GetUsersRegistratedPushUsers
 *
 * @apiSuccess (200) {array} List of users token
 *
 * @apiUse ErrorServer
 */
function getUsersRegistratedPush(req, _res) {
  const res = new HttpResponseWrapper(_res);

  getAllUsersRegistrated()
    .then((data) => res.sendResponse(200, data))
    .catch(res.sendServerError);
}

/**
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
 *   "messagingToken": "cjFl5JjYiaUdFfxuKefa...iv9ViE6_m"
 * }
 *
 *
 * @apiUse ErrorServer
 * @apiError (400) InvalidUser The user is not valid
 * @apiError (400) InvalidToken The token is not valid
 * @apiError (404) NotFound User not found
 */
function updateToken(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const { user, messagingToken } = req.body;
  if (!user) {
    return res.sendUsageError(400, "Missing user");
  }
  if (!messagingToken) {
    return res.sendUsageError(400, "Missing messaging token");
  }

  saveMessagingTokenInDatabase(user, messagingToken)
    .then((isUpdated) => {
      if (isUpdated) {
        res.sendResponse(200, {
          user: user,
          messagingToken: messagingToken,
        });
      } else {
        res.sendUsageError(404, "User not found");
      }
    })
    .catch(res.sendServerError);
}

function removeToken(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const { user } = req.body;
  if (!user) {
    return res.sendUsageError(400, "Missing user");
  }

  saveMessagingTokenInDatabase(user)
    .then((isUpdated) => {
      if (isUpdated) {
        res.sendResponse(200, {
          user: user,
          messagingToken: "NULL",
        });
      } else {
        res.sendUsageError(404, "User not found");
      }
    })
    .catch(res.sendServerError);
}

function sendNotificationToOneDevice(targetToken, data) {
  const message = {
    data: data,
    token: targetToken,
  };

  admin
    .messaging()
    .send(message)
    .catch((err) => console.error("Can't send notification to a single device", err));
}

export default { updateToken, removeToken, getUsersRegistratedPush, sendNotificationToOneDevice };

// ***** INTERNAL FUNCTIONS *****

function saveMessagingTokenInDatabase(user, messagingToken = undefined) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE user
                 SET us_messaging_token = ${messagingToken ? "?" : "NULL"}
                 WHERE us_login = ?`;
    const arrayOfValues = messagingToken ? [messagingToken, user] : [user];
    queryPromise(sql, arrayOfValues)
      .then((res) => {
        if (res.affectedRows === 0) {
          resolve(false);
        } else {
          resolve(true);
        }
      })
      .catch((error) => reject(addErrorTitle(error, "Can't update messaging token", true)));
  });
}

function getAllUsersRegistrated() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT us_messaging_token
                 FROM user
                 WHERE us_messaging_token IS NOT NULL`;
    queryPromise(sql)
      .then((res) => resolve(res.map((value) => value.us_messaging_token)))
      .catch((error) => reject(addErrorTitle(error, "Can't get all registrated push users", true)));
  });
}
