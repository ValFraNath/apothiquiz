import express from "express";

import { status } from "../controllers/api.js";
import { generateQuestion } from "../controllers/question.js";
import UserController from "../controllers/user.js";
import auth from "../middlewares/auth.middleware.js";

const apiRouter = express.Router();

apiRouter.get("/status", status);

apiRouter.get("/question/:type", generateQuestion);

apiRouter.get("/user", auth, UserController.getInfos);

apiRouter.post("/user/login", UserController.login);

export default apiRouter;
