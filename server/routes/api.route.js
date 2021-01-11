import express from "express";

import ApiController from "../controllers/api.js";
import QuestionController from "../controllers/question.js";
import UserController from "../controllers/user.js";
import auth from "../middlewares/auth.middleware.js";

const apiRouter = express.Router();

apiRouter.get("/status", ApiController.status);

apiRouter.get("/question/:type", QuestionController.generateQuestion);

apiRouter.get("/user", auth, UserController.getInfos);

apiRouter.post("/user/login", UserController.login);

export default apiRouter;
