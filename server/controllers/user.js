import jwt from "jsonwebtoken";
import { queryPromise } from "../db/database.js";
import dotenv from "dotenv";
dotenv.config();

const User = {};

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
User.login = function (req, res) {
  const { userPseudo, userPassword } = req.body;

  if (!userPseudo || !userPassword) {
    res.status(401).json({ message: "Bad request format." });
    return;
  }

  const sql =
    "SELECT COUNT(*) as found \
               FROM user                \
               WHERE us_login = ?";

  queryPromise(sql, [userPseudo])
    .then((sqlRes) => {
      let found = sqlRes[0]["found"];
      if (found) {
        if (queryCAS(userPseudo, userPassword)) {
          res.status(200).json({
            pseudo: userPseudo,
            token: jwt.sign({ pseudo: userPseudo }, process.env.TOKEN_PRIVATE_KEY),
          });
        } else {
          res.status(401).json({
            message: "Incorrect password.",
          });
        }
      } else {
        res.status(404).json({
          message: "User not found.",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: `login process error : ${error}` });
    });
};

function queryCAS(login, pass) {
  return pass === "1234";
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
User.getInfos = function (req, res) {
  var user = String(req.params.pseudo);
  if (user === "me") {
    user = req.body.auth_user;
  }

  getUserInformations(user)
    .then((infos) => {
      res.status(200).json(infos);
    })
    .catch((error) => {
      res.status(404).json({ message: error });
    });
};

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
User.saveInfos = async function (req, res) {
  var user = String(req.params.pseudo);
  if (user === "me") {
    user = req.body.auth_user;
  }

  if (req.body.auth_user != user) {
    // TODO? Add admin ?
    res.status(403).json({ message: "Not allowed" });
    return;
  }

  const { avatar } = req.body;

  if (!avatar && true) {
    // true will be replaced by another fields of the request
    res.status(400).json({ message: "No information given" });
    return;
  }

  if (avatar) {
    const wantedProperties = ["colorBG", "eyes", "hands", "hat", "mouth", "colorBody"];
    if (!wantedProperties.every((p) => Object.prototype.hasOwnProperty.call(avatar, p))) {
      res.status(400).json({ message: "Bad request" });
      return;
    }

    const integerProperties = ["eyes", "hands", "hat", "mouth"];
    if (!integerProperties.every((p) => Number(avatar[p]) === avatar[p])) {
      res.status(400).json({ message: "Bad request" });
      return;
    }

    const hexColorProperties = ["colorBG", "colorBody"];
    if (!hexColorProperties.every((p) => /^#[0-9A-Fa-f]{6}$/i.test(avatar[p]))) {
      res.status(400).json({ message: "Bad request" });
      return;
    }
  }

  getUserInformations(user)
    .then((infos) => {
      infos.avatar = avatar || infos.avatar;

      queryPromise("UPDATE user \
         SET us_avatar = ?      \
         WHERE us_login = ?;", [
        JSON.stringify(infos.avatar),
        infos.pseudo,
      ])
        .then(() => res.status(200).json(infos))
        .catch((err) => {
          console.error(err);
          res.status(500).json({ message: "Server side error" });
        });
    })
    .catch((error) => {
      res.status(404).json({ message: error });
    });
};

/**
 * Contruct a JSON object with informations for the user from the database
 * @param {String} pseudo ENT login of the user
 * @return {Object|null} user informations or null if user not found
 */
async function getUserInformations(pseudo) {
  return new Promise(function (resolve, reject) {
    queryPromise(
      "SELECT \
        us_login AS pseudo, \
        us_victories AS victories,    \
        us_defeats AS defeats, \
        us_avatar AS avatar \
      FROM user             \
      WHERE `us_login` = ?",
      [pseudo]
    )
      .then((res) => {
        if (res.length !== 1) {
          reject("User not found");
          return;
        }

        let result = {};
        try {
          result = {
            pseudo: res[0].pseudo,
            victories: Number(res[0].victories),
            defeats: Number(res[0].defeats),
            avatar: JSON.parse(res[0].avatar),
          };
        } catch (e) {
          console.error(e);
          reject("bad mysql response format");
          return;
        }

        resolve(result);
      })
      .catch((error) => {
        reject("Error", error);
      });
  });
}

export default User;
