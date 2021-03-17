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

const ONLY_ADMINS = true;

const usersApiRouter = express.Router();

usersApiRouter.get("/", AuthMiddleware(), HttpControllerWrapper(UserController.getAll));

usersApiRouter.post("/", AuthMiddleware(), HttpControllerWrapper(UserController.severalGetInfos));

usersApiRouter.post("/login", HttpControllerWrapper(UserController.login));

usersApiRouter.post("/token", HttpControllerWrapper(UserController.generateAccessToken));

usersApiRouter.post("/logout", AuthMiddleware(), HttpControllerWrapper(UserController.logout));

usersApiRouter.get("/:pseudo", AuthMiddleware(), HttpControllerWrapper(UserController.getInfos));

usersApiRouter.patch(
  "/users/:pseudo",
  AuthMiddleware(),
  HttpControllerWrapper(UserController.saveInfos)
);

export default usersApiRouter;
