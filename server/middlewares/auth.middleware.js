import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { HttpResponseWrapper } from "../global/HttpControllerWrapper.js";
dotenv.config();

/**
 * Create the authentication middleware
 * @param {boolean} onlyAdmin Boolean telling if the route is for admin only
 * @return {function(req,res,next)} The middleware
 */
function AuthMiddleware(onlyAdmin = false) {
  return (req, _res, next) => {
    const res = new HttpResponseWrapper(_res);
    try {
      const token = req.headers.authorization.split(" ")[1];
      const { user, isAdmin } = jwt.verify(token, process.env.APOTHIQUIZ_ACCESS_TOKEN_KEY);
      if (onlyAdmin && !isAdmin) {
        return res.sendUsageError(403, "Access denied");
      }
      req.body._auth = { user, isAdmin };
      next();
    } catch (e) {
      res.sendUsageError(401, "Unauthorized connection");
    }
  };
}

export default AuthMiddleware;
