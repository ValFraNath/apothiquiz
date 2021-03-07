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
import authenticationMiddleware from "../middlewares/auth.middleware.js";
import { createMulter } from "../middlewares/multer.middleware.js";

const apiRouter = express.Router();

apiRouter.get("/status", HttpControllerWrapper(ApiController.status));

apiRouter.get("/question/:type", HttpControllerWrapper(QuestionController.generateQuestion));

apiRouter.get("/users/", authenticationMiddleware, HttpControllerWrapper(UserController.getAll));

apiRouter.post(
  "/users/",
  authenticationMiddleware,
  HttpControllerWrapper(UserController.severalGetInfos)
);

apiRouter.post("/users/login", HttpControllerWrapper(UserController.login));

apiRouter.post("/users/token", HttpControllerWrapper(UserController.generateAccessToken));

apiRouter.post(
  "/users/logout",
  authenticationMiddleware,
  HttpControllerWrapper(UserController.logout)
);

apiRouter.get(
  "/users/:pseudo",
  authenticationMiddleware,
  HttpControllerWrapper(UserController.getInfos)
);

apiRouter.patch(
  "/users/:pseudo",
  authenticationMiddleware,
  HttpControllerWrapper(UserController.saveInfos)
);

apiRouter.post(
  "/duels/new",
  authenticationMiddleware,
  HttpControllerWrapper(DuelController.create)
);

apiRouter.get("/duels/", authenticationMiddleware, HttpControllerWrapper(DuelController.fetchAll));

apiRouter.get("/duels/:id", authenticationMiddleware, HttpControllerWrapper(DuelController.fetch));

apiRouter.post(
  "/duels/:id/:round",
  authenticationMiddleware,
  HttpControllerWrapper(DuelController.play)
);

const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

apiRouter.use(
  "/files/molecules",
  authenticationMiddleware,
  express.static(`${FILES_DIR}/molecules`)
);

apiRouter.use("/files/users", authenticationMiddleware, express.static(`${FILES_DIR}/users`));

apiRouter.use("/files/images", express.static(`${FILES_DIR}/images`));

apiRouter.post(
  "/import/molecules",
  authenticationMiddleware,
  createMulter(),
  HttpControllerWrapper(MoleculesImporterController.importMolecules)
);

apiRouter.get(
  "/import/molecules",
  authenticationMiddleware,
  HttpControllerWrapper(MoleculesImporterController.getLastImportedFile)
);

apiRouter.post(
  "/import/images",
  authenticationMiddleware,
  createMulter(true),
  HttpControllerWrapper(ImagesImporterController.importImages)
);

apiRouter.get(
  "/import/images",
  authenticationMiddleware,
  HttpControllerWrapper(ImagesImporterController.getLastImportedFile)
);

apiRouter.post(
  "/import/users",
  authenticationMiddleware,
  createMulter(),
  HttpControllerWrapper(UsersImporterController.importUsers)
);

apiRouter.get(
  "/import/users",
  authenticationMiddleware,
  createMulter(),
  HttpControllerWrapper(UsersImporterController.getLastImportedUsers)
);

apiRouter.get(
  "/config",
  authenticationMiddleware,
  HttpControllerWrapper(ConfigController.fetchConfig)
);

apiRouter.patch(
  "/config",
  authenticationMiddleware,
  HttpControllerWrapper(ConfigController.setConfig)
);

export default apiRouter;
