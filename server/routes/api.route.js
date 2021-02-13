import express from "express";

import ApiController from "../controllers/api.js";
import DuelController from "../controllers/duels.js";
import ImagesController from "../controllers/imagesImporter.js";
import ImporterController from "../controllers/moleculesImporter.js";
import QuestionController from "../controllers/question.js";
import UserController from "../controllers/user.js";
import authenticationMiddleware from "../middlewares/auth.middleware.js";
import { createMiddleware } from "../middlewares/multer.middleware.js";

const apiRouter = express.Router();

apiRouter.get("/status", ApiController.status);

apiRouter.get("/question/:type", QuestionController.generateQuestion);

apiRouter.get("/users/", authenticationMiddleware, UserController.getAll);

apiRouter.post("/users/", authenticationMiddleware, UserController.severalGetInfos);

apiRouter.post("/users/login", UserController.login);

apiRouter.get("/users/:pseudo", authenticationMiddleware, UserController.getInfos);

apiRouter.patch("/users/:pseudo", authenticationMiddleware, UserController.saveInfos);

apiRouter.post("/duels/new", authenticationMiddleware, DuelController.create);

apiRouter.get("/duels/", authenticationMiddleware, DuelController.fetchAll);

apiRouter.get("/duels/:id", authenticationMiddleware, DuelController.fetch);

apiRouter.post("/duels/:id/:round", authenticationMiddleware, DuelController.play);

apiRouter.use("/files", authenticationMiddleware, express.static("files"));

apiRouter.post(
  "/import/molecules",
  authenticationMiddleware,
  createMiddleware(),
  ImporterController.importMolecules
);

apiRouter.get(
  "/import/molecules",
  authenticationMiddleware,
  createMiddleware(),
  ImporterController.getLastImportedFile
);

apiRouter.post(
  "/import/images",
  authenticationMiddleware,
  createMiddleware(),
  ImagesController.importImages
);

apiRouter.get(
  "/import/images",
  authenticationMiddleware,
  createMiddleware(),
  ImagesController.getLastImportedFile
);

export default apiRouter;
