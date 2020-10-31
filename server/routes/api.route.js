import express from "express";

import { status } from "../controllers/api.js";
import { generateQuestion } from "../controllers/question.js";
import { login } from "../controllers/user.js";

const apiRouter = express.Router();

apiRouter.get("/status", status);

apiRouter.get("/question/:type", generateQuestion);

apiRouter.post("/user/login", login);

export default apiRouter;
