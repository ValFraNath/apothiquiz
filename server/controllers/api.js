import { getDatabaseVersion } from "../db/database.js";

export async function status(req, res) {
  let response = {
    status: "online",
    db_version: await getDatabaseVersion(),
  };

  res.status(200).json(response);
}
