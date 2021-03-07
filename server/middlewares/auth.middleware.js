import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { HttpResponseWrapper } from "../global/HttpControllerWrapper.js";
dotenv.config();

/**
 * Test if the request is correctly authenticated
 */
function auth(req, _res, next) {
  const res = new HttpResponseWrapper(_res);
  try {
    const token = req.headers.authorization.split(" ")[1];
    const { user, admin } = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
    req.body._auth = { user, admin };
    next();
  } catch (e) {
    res.sendUsageError(401, "Unauthorized connection");
  }
}

export default auth;
