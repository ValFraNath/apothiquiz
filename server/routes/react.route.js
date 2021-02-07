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

reactRouter.get("/homepage", goToReactIndex);

reactRouter.get("/createduel", goToReactIndex);

reactRouter.get("/duel/:id", goToReactIndex);

reactRouter.get("/duel/:id/play", goToReactIndex);

reactRouter.get("/admin", goToReactIndex);

export default reactRouter;
