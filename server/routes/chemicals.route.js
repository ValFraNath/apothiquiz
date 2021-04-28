import express from "express";

import chemicalsController from "../controllers/chemicals.js";
import HttpControllerWrapper from "../global/HttpControllerWrapper.js";

const chemicalsApiRouter = express.Router();

chemicalsApiRouter.get("/systems", HttpControllerWrapper(chemicalsController.getAllSystems));

export default chemicalsApiRouter;
