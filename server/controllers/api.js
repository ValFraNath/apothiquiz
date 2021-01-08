import db from "../db/database.js";

async function status(req, res) {
  let response = {
    status: "connected",
    api_version: await db.getSystemInformation("api_version"),
  };

  res.status(200).json(response);
}

export default { status };
