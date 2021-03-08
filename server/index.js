import fs from "fs";

import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";

import Database from "./db/database.js";
import { checkDuelsTask, removeDuelsTask } from "./files-script/cron-tasks.js";
import Logger from "./global/Logger.js";
import RequestSyntaxErrorHandler from "./middlewares/error.middleware.js";
import apiRouter from "./routes/api.route.js";
import reactRouter from "./routes/react.route.js";

dotenv.config();

const PORT = process.env.PORT || 5035;
const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

const app = express();
app.isReady = false;

if (!process.env.TOKEN_PRIVATE_KEY) {
  Logger.error(
    new Error("TOKEN_PRIVATE_KEY is not defined in .env. Please generate a random private key")
  );
  process.exit(1);
}

fs.mkdirSync(FILES_DIR, { recursive: true });

app.use(bodyParser.json());
app.use(express.static("../client/build/"));
app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);
app.use(RequestSyntaxErrorHandler);

startServer();

// ----- Start cron tasks
removeDuelsTask.start();
checkDuelsTask.start();

/**
 * Connect the server to the database and start the server
 */
async function startServer() {
  try {
    await Database.connect();
    app.listen(PORT, () => {
      app.isReady = true;
      Logger.info(`Server is running on port ${PORT}.`);
    });
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
