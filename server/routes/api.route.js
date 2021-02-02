import express from "express";

import ApiController from "../controllers/api.js";
import DuelController from "../controllers/duels.js";
import ImporterController from "../controllers/moleculesImporter.js";
import QuestionController from "../controllers/question.js";
import UserController from "../controllers/user.js";
import auth from "../middlewares/auth.middleware.js";
import multer from "../middlewares/multer.middleware.js";

const apiRouter = express.Router();

apiRouter.get("/status", ApiController.status);

apiRouter.get("/question/:type", QuestionController.generateQuestion);

apiRouter.get("/users/", auth, UserController.getAll);

apiRouter.post("/users/", auth, UserController.severalGetInfos);

apiRouter.post("/users/login", UserController.login);

apiRouter.get("/users/:pseudo", auth, UserController.getInfos);

apiRouter.patch("/users/:pseudo", auth, UserController.saveInfos);

apiRouter.post("/duels/new", auth, DuelController.create);

apiRouter.get("/duels/", auth, DuelController.fetchAll);

apiRouter.get("/duels/:id", auth, DuelController.fetch);

apiRouter.post("/duels/:id/:round", auth, DuelController.play);

apiRouter.post("/import/molecules", auth, multer, ImporterController.importMolecules);

apiRouter.get("/import/molecules", auth, multer, ImporterController.getLastImportedFile);

export default apiRouter;
