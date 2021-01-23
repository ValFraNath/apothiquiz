import express from "express";

import ApiController from "../controllers/api.js";
import QuestionController from "../controllers/question.js";
import UserController from "../controllers/user.js";
import DuelController from "../controllers/duels.js";
import auth from "../middlewares/auth.middleware.js";

const apiRouter = express.Router();

apiRouter.get("/status", ApiController.status);

apiRouter.get("/question/:type", QuestionController.generateQuestion);

apiRouter.post("/user/login", UserController.login);

apiRouter.get("/user/:pseudo", auth, UserController.getInfos);

apiRouter.patch("/user/:pseudo", auth, UserController.saveInfos);

apiRouter.post("/duel/new", auth, DuelController.create);

apiRouter.get("/duel/", auth, DuelController.fetchAll);

apiRouter.get("/duel/:id", auth, DuelController.fetch);

apiRouter.post("/duel/:id/:round", auth, DuelController.play);

export default apiRouter;
