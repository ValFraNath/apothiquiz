import { queryPromise } from "../db/database.js";

const Users = {};

Users.getInfos = function (req, res) {
  const listOfUsers = req.body;
  if (!Array.isArray(listOfUsers) || listOfUsers.length === 0) {
    res.status(401).json({ error: "Bad request format." });
    return;
  }

  const sqlWhere = listOfUsers.map(() => "us_login = ?");
  const sql = `SELECT us_login AS pseudo, us_wins AS wins, us_losts AS losses, us_avatar AS avatar
               FROM user
               WHERE ${sqlWhere.join(" OR ")}`;

  queryPromise(sql, listOfUsers)
    .then((sqlRes) => {
      const usersData = {};
      try {
        for (let value of sqlRes) {
          usersData[value.pseudo] = {
            pseudo: value.pseudo,
            wins: Number(value.wins),
            losses: Number(value.losses),
            avatar: JSON.parse(value.avatar),
          };
        }
      } catch (e) {
        res.status(500).json({ error: e });
      }
      res.status(200).json(usersData);
    })
    .catch((error) => {
      res.status(500).json({ error: error });
    });
};

export default Users;
