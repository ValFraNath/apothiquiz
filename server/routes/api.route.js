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

import configApiRouter from "./config.route.js";
import duelsApiRouter from "./duels.route.js";
import filesApiRouter from "./files.route.js";
import importApiRouter from "./import.route.js";
import usersApiRouter from "./users.route.js";

const ONLY_ADMINS = true;

const apiRouter = express.Router();

/** Sub routes */

apiRouter.use("/users", usersApiRouter);

apiRouter.use("/duels", AuthMiddleware(), duelsApiRouter);

apiRouter.use("/files", filesApiRouter);

apiRouter.use("/import", AuthMiddleware(ONLY_ADMINS), importApiRouter);

apiRouter.use("/config", AuthMiddleware(ONLY_ADMINS), configApiRouter);

/** Top level routes */

apiRouter.get("/status", HttpControllerWrapper(ApiController.status));

apiRouter.get("/question/:type", HttpControllerWrapper(QuestionController.generateQuestion));

export default apiRouter;
