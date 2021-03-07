import fs from "fs";

import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";

import Database from "./db/database.js";
import Logger from "./global/Logger.js";
import RequestSyntaxErrorHandler from "./middlewares/error.middleware.js";
import apiRouter from "./routes/api.route.js";
import reactRouter from "./routes/react.route.js";

dotenv.config();

const PORT = process.env.PORT || 5035;
const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

const app = express();
app.isReady = false;

checkEnv();

fs.mkdirSync(FILES_DIR, { recursive: true });

app.use(bodyParser.json());
app.use(express.static("../client/build/"));
app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);
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

/**
 *
 */
function checkEnv() {
  const keys = [
    "ACCESS_TOKEN_KEY",
    "REFRESH_TOKEN_KEY",
    "DB_USER",
    "DB_HOST",
    "DB_PASSWORD",
    "DB_DATABASE",
  ];
  for (const key of keys) {
    if (!process.env[key]) {
      Logger.error(
        new Error(`The ${key} environment variable is required but not defined in .env.`)
      );
      process.exit(1);
    }
  }
}

export default app;
