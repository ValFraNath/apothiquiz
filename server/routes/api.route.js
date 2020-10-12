import express from "express";

const apiRouter = express.Router();

apiRouter.get("/status", function (req, res) {
  res.status(200).json("Hello World!");
});

export default apiRouter;
