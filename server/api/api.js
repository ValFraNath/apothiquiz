import * as db from "../db/database.js";

export async function status(req, res) {
  let response = {
    status: "online",
    db_version: await db.getDatabaseVersion(),
  };

  res.status(200).json(response);
}
