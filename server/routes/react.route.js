import express from "express";

const reactRouter = express.Router();

function goToReactIndex(_, res) {
  res.sendFile("index.html", { root: "../client/build/" });
}

reactRouter.get("/", goToReactIndex);

reactRouter.get("/about", goToReactIndex);

reactRouter.get("/train", goToReactIndex);

reactRouter.get("/login", goToReactIndex);

reactRouter.get("/profile", goToReactIndex);

reactRouter.get("/userhome", goToReactIndex);

export default reactRouter;
