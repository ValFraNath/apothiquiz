import express from "express";

import UserController from "../../controllers/backend/user.js";
import HttpControllerWrapper from "../../global/HttpControllerWrapper.js";

const usersBEApiRouter = express.Router();

usersBEApiRouter.get("/all", HttpControllerWrapper(UserController.getAllUsers));

export default usersBEApiRouter;
