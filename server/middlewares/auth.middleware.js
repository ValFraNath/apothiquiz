import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
dotenv.config();

/**
 * Test if the request is correctly authenticated
 */
function auth(req, _res, next) {
  const res = new HttpResponseWrapper(_res);
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY);
    req.body.authUser = decodedToken.pseudo;
    next();
  } catch (e) {
    res.sendUsageError(401, "Unauthorized connection");
  }
}

export default auth;
