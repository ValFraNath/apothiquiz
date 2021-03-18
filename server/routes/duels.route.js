import express from "express";

import DuelController from "../controllers/duels.js";
import HttpControllerWrapper from "../global/HttpControllerWrapper.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";

const ONLY_ADMINS = true;

const duelApiRouter = express.Router();

duelApiRouter.post("/new", HttpControllerWrapper(DuelController.create));

duelApiRouter.get("/", HttpControllerWrapper(DuelController.fetchAll));

duelApiRouter.get("/:id", HttpControllerWrapper(DuelController.fetch));

duelApiRouter.post("/:id/:round", HttpControllerWrapper(DuelController.play));

export default duelApiRouter;
