import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { queryPromise } from "../db/database.js";
import HttpResponseWrapper from "../modules/HttpResponseWrapper.js";

dotenv.config();

/**
 * @api       {post}        /user/login   Post a user login
 * @apiName   PostUserLogin
 * @apiGroup  User
 *
 * @apiParam {string} userPseudo    ENT Login
 * @apiParam {string} userPassword  ENT password
 *
 * @apiSuccess (200) {string} pseudo  the ENT login
 * @apiSuccess (200) {string} token   the user token
 *
 * @apiError   (401) IncorrectPassword
 * @apiError   (404) UserNotFound
 * @apiUse ErrorServer
 */
function login(req, _res) {
  const res = new HttpResponseWrapper(_res);
  const { userPseudo, userPassword } = req.body;

  if (!userPseudo || !userPassword) {
    return res.sendUsageError(401, "Bad request format.");
  }

  doesUserExist(userPseudo)
    .then((userExists) => {
      if (userExists) {
        if (queryCAS(userPseudo, userPassword)) {
          res.sendResponse(200, {
            pseudo: userPseudo,
            token: jwt.sign({ pseudo: userPseudo }, process.env.TOKEN_PRIVATE_KEY),
          });
        } else {
          res.sendUsageError(401, "Authentication failed");
        }
      } else {
        res.sendUsageError(404, "User not found.");
      }
    })
    .catch(res.sendServerError);
}

/**
 * @apiDefine GetUserSuccess
 *
 * @apiSuccess {string} pseudo            ENT login
 * @apiSuccess {number} victories         Number of victories
 * @apiSuccess {number} defeats           Number of defeats
 * @apiSuccess {Object} avatar            Avatar object
 * @apiSuccess {string} avatar.colorBG    Hex background color
 * @apiSuccess {string} avatar.colorBody  Hex Body colod
 * @apiSuccess {number} avatar.eyes       Number of the eyes
 * @apiSuccess {number} avatar.hands      Number of the hands
 * @apiSuccess {number} avatar.hat        Number of the hat
 * @apiSuccess {number} avatar.mouth      Number of the mouth
 */

/**
 * @api       {get}        /user/:pseudo   Get user informations
 * @apiName   GetUserInformations
 * @apiGroup  User
 *
 * @apiPermission LoggedIn
 *
 * @apiUse GetUserSuccess
 * @apiError (404) UserNotFound User not found
 */
function getInfos(req, _res) {
  const res = new HttpResponseWrapper(_res);
  let user = String(req.params.pseudo);
  if (user === "me") {
    user = req.body.auth_user;
  }

  getUserInformations(user)
    .then((infos) => {
      if (!infos) {
        return res.sendUsageError(404, "User not found");
      }
      res.sendResponse(200, infos);
    })
    .catch(res.sendServerError);
}

/**
 * @api       {patch}               /user/:pseudo   Patch user informations
 * @apiSampleRequest off
 * @apiName   PatchUserInformations
 * @apiGroup  User
 * @apiDescription At least one field must be filled
 
 * @apiPermission LoggedIn
 * @apiPermission (for the moment, users can only update themselves)
 * 
 * @apiParam {string}             [pseudo]            ENT login
 * @apiParam {Object}             [avatar]            Avatar object
 * @apiParam {string{7}=hexColor} avatar.colorBG      Hex background color
 * @apiParam {string{7}=hexColor} avatar.colorBody    Hex Body color
 * @apiParam {number{0...}}       avatar.eyes         Number of the eyes
 * @apiParam {number{0...}}       avatar.hands        Number of the hands
 * @apiParam {number{0...}}       avatar.hat          Number of the hat
 * @apiParam {number{0...}}       avatar.mouth        Number of the mouth
 *
 * @apiUse GetUserSuccess
 * @apiUse ErrorNotAllowed
 * @apiUse ErrorBadRequest
 * @apiError (404) NotFound   User not found
 * @apiUse ErrorServer
 */
function saveInfos(req, _res) {
  const res = new HttpResponseWrapper(_res);
  var user = String(req.params.pseudo);
  if (user === "me") {
    user = req.body.auth_user;
  }

  if (req.body.auth_user != user) {
    // TODO? Add admin ?
    return res.sendUsageError(403, "Operation not allowed");
  }

  const { avatar } = req.body;

  if (!avatar && true) {
    // true will be replaced by another fields of the request
    return res.sendUsageError(400, "No information given");
  }

  if (avatar) {
    const wantedProperties = ["colorBG", "eyes", "hands", "hat", "mouth", "colorBody"];
    if (!wantedProperties.every((p) => Object.prototype.hasOwnProperty.call(avatar, p))) {
      return res.sendUsageError(400, "Bad request");
    }

    const integerProperties = ["eyes", "hands", "hat", "mouth"];
    if (!integerProperties.every((p) => Number(avatar[p]) === avatar[p])) {
      return res.sendUsageError(400, "Bad request");
    }

    const hexColorProperties = ["colorBG", "colorBody"];
    if (!hexColorProperties.every((p) => /^#[0-9A-Fa-f]{6}$/i.test(avatar[p]))) {
      return res.sendUsageError(400, "Bad request");
    }
  }

  getUserInformations(user)
    .then((infos) => {
      infos.avatar = avatar || infos.avatar;
      updateUserAvatar(user, infos.avatar)
        .then(() => res.sendResponse(200, infos))
        .catch(res.sendServerError);
    })
    .catch(res.sendServerError);
}

export default { login, saveInfos, getInfos };

// ***** INTERNAL FUNCTIONS *****

/**
 * Check if a user exists
 * @param {string} login The user login
 * @returns {Promise<boolean>} True if the user exists, false otherwise
 */
function doesUserExist(login) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT COUNT(*) as found 
                  FROM user                
                  WHERE us_login = ?`;
    queryPromise(sql, [login])
      .then((res) => resolve(res[0].found > 0))
      .catch(reject);
  });
}

function queryCAS(login, pass) {
  return pass === "1234";
}

/**
 * Update the user avatar in database
 * @param {string} user The username login
 * @param {object} avatar The avatar object
 * @returns {Promise}
 */
function updateUserAvatar(user, avatar) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE user 
                  SET us_avatar = ?      
                  WHERE us_login = ?;`;

    queryPromise(sql, [JSON.stringify(avatar), user])
      .then(() => resolve())
      .catch(reject);
  });
}

/**
 * Contruct a JSON object with informations for the user from the database
 * @param {String} pseudo ENT login of the user
 * @return {Object|null} user informations or null if user not found
 */
function getUserInformations(pseudo) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT 
                  us_login AS pseudo, 
                  us_victories AS victories,    
                  us_defeats AS defeats, 
                  us_avatar AS avatar 
                FROM user             
                WHERE us_login = ?`;

    queryPromise(sql, [pseudo])
      .then((res) => {
        if (res.length !== 1) {
          resolve(null);
          return;
        }

        const result = {
          pseudo: res[0].pseudo,
          victories: Number(res[0].victories),
          defeats: Number(res[0].defeats),
          avatar: JSON.parse(res[0].avatar),
        };

        resolve(result);
      })
      .catch(reject);
  });
}
