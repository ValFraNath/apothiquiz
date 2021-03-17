import express from "express";

import ApiController from "../controllers/api.js";
import ConfigController from "../controllers/config.js";
import DuelController from "../controllers/duels.js";
import ImagesImporterController from "../controllers/imagesImporter.js";
import MoleculesImporterController from "../controllers/moleculesImporter.js";
import QuestionController from "../controllers/question.js";
import UserController from "../controllers/user.js";
import UsersImporterController from "../controllers/usersImportation.js";
import HttpControllerWrapper from "../global/HttpControllerWrapper.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import { createMulter } from "../middlewares/multer.middleware.js";

import duelsApiRouter from "./duels.route.js";
import usersApiRouter from "./users.route.js";

const ONLY_ADMINS = true;

const apiRouter = express.Router();

apiRouter.get("/status", HttpControllerWrapper(ApiController.status));

apiRouter.get("/question/:type", HttpControllerWrapper(QuestionController.generateQuestion));

apiRouter.use("/users", usersApiRouter);

apiRouter.use("/duels", duelsApiRouter);

const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

apiRouter.use(
  "/files/molecules",
  AuthMiddleware(ONLY_ADMINS),
  express.static(`${FILES_DIR}/molecules`)
);

apiRouter.use("/files/users", AuthMiddleware(ONLY_ADMINS), express.static(`${FILES_DIR}/users`));

apiRouter.use("/files/images", express.static(`${FILES_DIR}/images`));

apiRouter.post(
  "/import/molecules",
  AuthMiddleware(ONLY_ADMINS),
  createMulter(),
  HttpControllerWrapper(MoleculesImporterController.importMolecules)
);

apiRouter.get(
  "/import/molecules",
  AuthMiddleware(ONLY_ADMINS),
  HttpControllerWrapper(MoleculesImporterController.getLastImportedFile)
);

apiRouter.post(
  "/import/images",
  AuthMiddleware(ONLY_ADMINS),
  createMulter(true),
  HttpControllerWrapper(ImagesImporterController.importImages)
);

apiRouter.get(
  "/import/images",
  AuthMiddleware(ONLY_ADMINS),
  HttpControllerWrapper(ImagesImporterController.getLastImportedFile)
);

apiRouter.post(
  "/import/users",
  AuthMiddleware(ONLY_ADMINS),
  createMulter(),
  HttpControllerWrapper(UsersImporterController.importUsers)
);

apiRouter.get(
  "/import/users",
  AuthMiddleware(ONLY_ADMINS),
  createMulter(),
  HttpControllerWrapper(UsersImporterController.getLastImportedUsers)
);

apiRouter.get(
  "/config",
  AuthMiddleware(ONLY_ADMINS),
  HttpControllerWrapper(ConfigController.fetchConfig)
);

apiRouter.patch(
  "/config",
  AuthMiddleware(ONLY_ADMINS),
  HttpControllerWrapper(ConfigController.setConfig)
);

export default apiRouter;
