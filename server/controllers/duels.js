import { queryPromise } from "../db/database.js";

function create(req, res) {
  const username = req.body.auth_user;
  const players = req.body.players;
  console.log(username, req.body);

  if (players.length !== 2) {
    return res.status(400).json({ message: "Exactly two players must be specified" });
  }

  if (!players.includes(username)) {
    return res.status(403).json({ message: "You cannot create a duel for other players" });
  }

  const sendLocalError500 = (error) => sendError500(res, error);

  doUsersExist(...players)
    .then((yes) => {
      if (!yes) {
        return res.status(404).json({ message: "Users not found" });
      }
      return res.status(200).json({ message: "ok" });
    })
    .catch(sendLocalError500);
}

// eslint-disable-next-line no-unused-vars
function fetch(req, res) {}

// eslint-disable-next-line no-unused-vars
function play(req, res) {}

export default { create, fetch, play };

// ***** INTERNAL FUNCTIONS *****

function sendError500(res, error) {
  console.error(error);
  return res.status(500).json({ message: "Server side error" });
}

/**
 * Check if all users in a list exist
 * @param  {...string} users The list of users
 * @returns {Promise<boolean>}
 */
function doUsersExist(...users) {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT us_login \
                  FROM user \
                  WHERE us_login IN (${Array(users.length).fill("?").join(",")});`;

    queryPromise(sql, users)
      .then((sqlRes) => {
        if (sqlRes.length !== users.length) {
          resolve(false);
        }
        resolve(true);
      })
      .catch(reject);
  });
}
