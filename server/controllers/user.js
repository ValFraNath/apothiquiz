import jwt from "jsonwebtoken";
import { queryPromise } from "../db/database.js";

export async function login(req, res) {
  const { userPseudo, userPassword } = req.body;
  console.log(userPseudo, userPassword);

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
            token: jwt.sign({ pseudo: userPseudo }, "TOKEN_KEY"),
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
      console.log("error");
      res.status(401).json({ error: error });
    });
}

function queryCAS(login, pass) {
  return pass === "1234";
}
