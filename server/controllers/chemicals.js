import { queryPromise } from "../db/database.js";

async function getAllSystems(req, res) {
  const sql = "SELECT sy_id, sy_name FROM system WHERE sy_higher IS NULL;";
  const data = await queryPromise(sql);
  res.sendResponse(200, data);
}

export default { getAllSystems };
