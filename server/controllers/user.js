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
            token: jwt.sign(
              { pseudo: userPseudo },
              process.env.TOKEN_PRIVATE_KEY
            ),
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
      console.log("mysql error");
      res.status(500).json({ error: `MySql query error : ${error}` });
    });
};

function queryCAS(login, pass) {
  return pass === "1234";
}

User.getInfos = function (req, res) {
  const user = req.body.auth_user;
  console.log(req.body);
  res.status(200).json({
    pseudo: user,
  });
};

export default User;
