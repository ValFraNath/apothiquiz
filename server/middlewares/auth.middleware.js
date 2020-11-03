import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * Test if the request is correctly authenticated
 */
function auth(req, res, next) {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY);
    req.body.auth_user = decodedToken.pseudo;
    next();
  } catch (e) {
    res.status(401).json({ error: "Unauthorized connection" });
  }
}

export default auth;
