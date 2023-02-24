import fs from "fs";

import bodyParser from "body-parser";
import express from "express";

import "./import-env.js"; // Must be imported before other scripts to load environment variables

import { checkDuelsTask, removeDuelsTask } from "./cron-scripts/cron-tasks.js";
import Database from "./db/database.js";
import Logger from "./global/Logger.js";
import RequestSyntaxErrorHandler from "./middlewares/error.middleware.js";
import apiRouter from "./routes/api.route.js";

const PORT = process.env.APOTHIQUIZ_SERVER_PORT || 5035;
const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

const app = express();
app.isReady = false;

fs.mkdirSync(FILES_DIR, { recursive: true });

app.use(bodyParser.json());
app.use("/api/v1/", apiRouter);
app.use(RequestSyntaxErrorHandler);

startServer();

/**
 * Connect the server to the database and start the server
 */
async function startServer() {
  try {
    await Database.start();
    app.listen(PORT, () => {
      app.isReady = true;
      Logger.info(`Server is running on port ${PORT}.`);
    });

    removeDuelsTask.start();
    checkDuelsTask.start();
  } catch (error) {
    Logger.error(error);
    process.exit(1);
  }
}

/**
 * Check every <interval> ms if the server is ready to use
 * @param callback  The function to call when the server is ready
 * @param interval  The interval between checks
 */
app.waitReady = function (callback, interval = 100) {
  let int = setInterval(() => {
    if (app.isReady) {
      callback();
      clearInterval(int);
    }
  }, interval);
};

export default app;
