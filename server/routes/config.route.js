import express from "express";

import ConfigController from "../controllers/config.js";
import HttpControllerWrapper from "../global/HttpControllerWrapper.js";

const configApiRouter = express.Router();

configApiRouter.get("/", HttpControllerWrapper(ConfigController.fetchConfig));

configApiRouter.patch("/", HttpControllerWrapper(ConfigController.setConfig));

export default configApiRouter;
