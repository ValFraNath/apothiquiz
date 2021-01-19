import express from "express";

const reactRouter = express.Router();

function goToReactIndex(req, res) {
  res.sendFile("index.html", { root: "../client/build/" });
}

reactRouter.get("/", goToReactIndex);

reactRouter.get("/about", goToReactIndex);

reactRouter.get("/train", goToReactIndex);

reactRouter.get("/login", goToReactIndex);

reactRouter.get("/profile", goToReactIndex);

export default reactRouter;
