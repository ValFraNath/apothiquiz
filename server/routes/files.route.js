import express from "express";

import AuthMiddleware from "../middlewares/auth.middleware.js";

const ONLY_ADMINS = true;

const filesApiRouter = express.Router();

const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

filesApiRouter.use(
  "/molecules",
  AuthMiddleware(ONLY_ADMINS),
  express.static(`${FILES_DIR}/molecules`)
);

filesApiRouter.use("/users", AuthMiddleware(ONLY_ADMINS), express.static(`${FILES_DIR}/users`));

filesApiRouter.use("/images", express.static(`${FILES_DIR}/images`));

export default filesApiRouter;
