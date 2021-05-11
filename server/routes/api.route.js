import express from "express";

import ApiController from "../controllers/api.js";
import QuestionController from "../controllers/question.js";
import HttpControllerWrapper from "../global/HttpControllerWrapper.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";

import chemicalsApiRouter from "./chemicals.route.js";
import configApiRouter from "./config.route.js";
import duelsApiRouter from "./duels.route.js";
import filesApiRouter from "./files.route.js";
import importApiRouter from "./import.route.js";
import usersApiRouter from "./users.route.js";
import usersBEApiRouter from "./backend/users.route.js";

const ONLY_ADMINS = true;

const apiRouter = express.Router();

/** Sub routes */

apiRouter.use("/users", usersApiRouter);

apiRouter.use("/duels", AuthMiddleware(), duelsApiRouter);

apiRouter.use("/files", filesApiRouter);

apiRouter.use("/import", AuthMiddleware(ONLY_ADMINS), importApiRouter);

apiRouter.use("/config", AuthMiddleware(ONLY_ADMINS), configApiRouter);

apiRouter.use("/chemicals", chemicalsApiRouter);

apiRouter.use("/usersBE", usersBEApiRouter);

/** Top level routes */

apiRouter.get("/status", HttpControllerWrapper(ApiController.status));

apiRouter.get("/question/:type", HttpControllerWrapper(QuestionController.generateQuestion));

export default apiRouter;
