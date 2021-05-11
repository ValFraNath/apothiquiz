import { queryPromise } from "../../db/database.js";

/** BACKEND */
async function getAllUsers(req, res) {
  const sql = "SELECT us_login, us_admin FROM user WHERE us_deleted IS NULL;";
  const data = await queryPromise(sql);
  res.sendResponse(200, data);
}

export default { getAllUsers };
