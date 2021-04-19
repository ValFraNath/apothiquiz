// eslint-disable-next-line no-unused-vars
import express from "express";

import { queryPromise } from "../db/database.js";
// eslint-disable-next-line no-unused-vars
import { HttpResponseWrapper } from "../global/HttpControllerWrapper.js";

async function getAllSystems(req, res) {
  const sql = "SELECT sy_id, sy_name FROM system WHERE sy_higher IS NULL;";
  const data = await queryPromise(sql);
  res.sendResponse(200, data);
}

export default { getAllSystems };
