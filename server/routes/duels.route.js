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

const duelApiRouter = express.Router();

duelApiRouter.post("/new", AuthMiddleware(), HttpControllerWrapper(DuelController.create));

duelApiRouter.get("/", AuthMiddleware(), HttpControllerWrapper(DuelController.fetchAll));

duelApiRouter.get("/:id", AuthMiddleware(), HttpControllerWrapper(DuelController.fetch));

duelApiRouter.post("/:id/:round", AuthMiddleware(), HttpControllerWrapper(DuelController.play));

export default duelApiRouter;
