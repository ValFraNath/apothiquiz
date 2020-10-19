import express from "express";

import * as api from "../api/api.js";

const apiRouter = express.Router();

apiRouter.get("/status", api.status);

export default apiRouter;
