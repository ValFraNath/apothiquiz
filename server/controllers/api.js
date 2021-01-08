import db from "../db/database.js";

async function status(req, res) {
  let response = {
    status: "online",
    db_version: await db.getVersion(),
  };

  res.status(200).json(response);
}

export default { status };
