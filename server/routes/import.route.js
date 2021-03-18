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

const importApiRouter = express.Router();

importApiRouter.post(
  "/molecules",
  createMulter(),
  HttpControllerWrapper(MoleculesImporterController.importMolecules)
);

importApiRouter.get(
  "/molecules",
  HttpControllerWrapper(MoleculesImporterController.getLastImportedFile)
);

importApiRouter.post(
  "/images",
  createMulter(true),
  HttpControllerWrapper(ImagesImporterController.importImages)
);

importApiRouter.get("/images", HttpControllerWrapper(ImagesImporterController.getLastImportedFile));

importApiRouter.post(
  "/users",
  createMulter(),
  HttpControllerWrapper(UsersImporterController.importUsers)
);

importApiRouter.get(
  "/users",
  createMulter(),
  HttpControllerWrapper(UsersImporterController.getLastImportedUsers)
);

export default importApiRouter;
