import jwt from "jsonwebtoken";
import { queryPromise } from "../db/database.js";
import dotenv from "dotenv";
dotenv.config();

const User = {};

User.login = function (req, res) {
  const { userPseudo, userPassword } = req.body;

  if (!userPseudo || !userPassword) {
    res.status(401).json({ error: "Bad request format." });
    return;
  }

  let sql = `SELECT COUNT(*) as found
                FROM user
                WHERE us_login = "${userPseudo}"`;

  queryPromise(sql)
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
            error: "Incorrect password.",
          });
        }
      } else {
        res.status(401).json({
          error: "User not found.",
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error: `login process error : ${error}` });
    });
};

function queryCAS(login, pass) {
  return pass === "1234";
}

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
      res.status(404).json({ error: error });
    });
};

User.saveInfos = async function (req, res) {
  var user = String(req.params.pseudo);
  if (user === "me") {
    user = req.body.auth_user;
  }

  if (req.body.auth_user != user) {
    // TODO? Add admin ?
    res.status(403).json({ error: "Not allowed" });
    return;
  }

  const { avatar } = req.body;

  if (!avatar && true) {
    // true will be replaced by another fields of the request
    res.status(400).json({ error: "No information given" });
    return;
  }

  if (avatar) {
    const wantedProperties = ["colorBG", "eyes", "hands", "hat", "mouth", "colorBody"];
    if (!wantedProperties.every((p) => Object.prototype.hasOwnProperty.call(avatar, p))) {
      res.status(400).json({ error: "Bad request" });
      return;
    }
  }

  getUserInformations(user)
    .then((infos) => {
      infos.avatar = avatar || infos.avatar;

      queryPromise("UPDATE user        \
      SET us_avatar = ? \
      WHERE us_login = ?;", [
        JSON.stringify(infos.avatar),
        infos.pseudo,
      ])
        .then(() => res.status(200).json(infos))
        .catch((err) => {
          console.error(err);
          res.status(500).json({ error: "Server side error" });
        });
    })
    .catch((error) => {
      res.status(404).json({ error: error });
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
        us_wins AS wins,    \
        us_losts AS losses, \
        us_avatar AS avatar \
      FROM user             \
      WHERE `us_login` = ?",
      [pseudo]
    )
      .catch((error) => {
        reject("Error", error);
      })
      .then((res) => {
        if (res.length !== 1) {
          reject("User not found");
          return;
        }

        let result = {};
        try {
          result = {
            pseudo: res[0].pseudo,
            wins: Number(res[0].wins),
            losses: Number(res[0].losses),
            avatar: JSON.parse(res[0].avatar),
          };
        } catch (e) {
          console.error(e);
          reject("bad mysql response format");
          return;
        }

        resolve(result);
      });
  });
}

export default User;
