import express from "express";

import UserController from "../controllers/user.js";
import HttpControllerWrapper from "../global/HttpControllerWrapper.js";
import AuthMiddleware from "../middlewares/auth.middleware.js";

const usersApiRouter = express.Router();

usersApiRouter.get("/", AuthMiddleware(), HttpControllerWrapper(UserController.getAll));

usersApiRouter.post("/", AuthMiddleware(), HttpControllerWrapper(UserController.severalGetInfos));

usersApiRouter.post("/login", HttpControllerWrapper(UserController.login));

usersApiRouter.post("/token", HttpControllerWrapper(UserController.generateAccessToken));

usersApiRouter.post("/logout", AuthMiddleware(), HttpControllerWrapper(UserController.logout));

usersApiRouter.get("/:pseudo", AuthMiddleware(), HttpControllerWrapper(UserController.getInfos));

usersApiRouter.patch("/:pseudo", AuthMiddleware(), HttpControllerWrapper(UserController.saveInfos));

export default usersApiRouter;
