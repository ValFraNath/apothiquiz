import express from "express";

import * as api from "../api/api.js";
import { generateQuestion } from "../api/question.js";

const apiRouter = express.Router();

apiRouter.get("/status", api.status);

apiRouter.get("/question/:type", generateQuestion);

export default apiRouter;
