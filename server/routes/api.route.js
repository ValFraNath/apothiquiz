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

const apiRouter = express.Router();

apiRouter.get("/status", HttpControllerWrapper(ApiController.status));

apiRouter.get("/question/:type", HttpControllerWrapper(QuestionController.generateQuestion));

apiRouter.get("/users/", AuthMiddleware(), HttpControllerWrapper(UserController.getAll));

apiRouter.post("/users/", AuthMiddleware(), HttpControllerWrapper(UserController.severalGetInfos));

apiRouter.post("/users/login", HttpControllerWrapper(UserController.login));

apiRouter.post("/users/token", HttpControllerWrapper(UserController.generateAccessToken));

apiRouter.post("/users/logout", AuthMiddleware(), HttpControllerWrapper(UserController.logout));

apiRouter.get("/users/:pseudo", AuthMiddleware(), HttpControllerWrapper(UserController.getInfos));

apiRouter.patch(
  "/users/:pseudo",
  AuthMiddleware(),
  HttpControllerWrapper(UserController.saveInfos)
);

apiRouter.post("/duels/new", AuthMiddleware(), HttpControllerWrapper(DuelController.create));

apiRouter.get("/duels/", AuthMiddleware(), HttpControllerWrapper(DuelController.fetchAll));

apiRouter.get("/duels/:id", AuthMiddleware(), HttpControllerWrapper(DuelController.fetch));

apiRouter.post("/duels/:id/:round", AuthMiddleware(), HttpControllerWrapper(DuelController.play));

const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

apiRouter.use("/files/molecules", AuthMiddleware(true), express.static(`${FILES_DIR}/molecules`));

apiRouter.use("/files/users", AuthMiddleware(true), express.static(`${FILES_DIR}/users`));

apiRouter.use("/files/images", express.static(`${FILES_DIR}/images`));

apiRouter.post(
  "/import/molecules",
  AuthMiddleware(true),
  createMulter(),
  HttpControllerWrapper(MoleculesImporterController.importMolecules)
);

apiRouter.get(
  "/import/molecules",
  AuthMiddleware(true),
  HttpControllerWrapper(MoleculesImporterController.getLastImportedFile)
);

apiRouter.post(
  "/import/images",
  AuthMiddleware(true),
  createMulter(true),
  HttpControllerWrapper(ImagesImporterController.importImages)
);

apiRouter.get(
  "/import/images",
  AuthMiddleware(true),
  HttpControllerWrapper(ImagesImporterController.getLastImportedFile)
);

apiRouter.post(
  "/import/users",
  AuthMiddleware(),
  createMulter(),
  HttpControllerWrapper(UsersImporterController.importUsers)
);

apiRouter.get(
  "/import/users",
  AuthMiddleware(),
  createMulter(),
  HttpControllerWrapper(UsersImporterController.getLastImportedUsers)
);

apiRouter.get("/config", AuthMiddleware(true), HttpControllerWrapper(ConfigController.fetchConfig));

apiRouter.patch("/config", AuthMiddleware(true), HttpControllerWrapper(ConfigController.setConfig));

export default apiRouter;
