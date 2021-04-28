import fs from "fs";

import bodyParser from "body-parser";
import dotenv from "dotenv";
import express from "express";

import { checkDuelsTask, removeDuelsTask } from "./cron-scripts/cron-tasks.js";
import Database from "./db/database.js";
import Logger from "./global/Logger.js";
import RequestSyntaxErrorHandler from "./middlewares/error.middleware.js";
import apiRouter from "./routes/api.route.js";

dotenv.config();

const PORT = process.env.PORT || 5035;
const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";

const app = express();
app.isReady = false;

checkEnv();

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

/**
 * Verify that all required environment variables are defined
 * Otherwise, the process is stopped
 */
function checkEnv() {
  let needToExit = false;
  const keys = [
    "ACCESS_TOKEN_KEY",
    "REFRESH_TOKEN_KEY",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    process.env.NODE_ENV === "test" ? "DB_DATABASE_TEST" : "DB_DATABASE",
  ];

  if (process.env.NODE_ENV === "production") {
    keys.push("LDAP_URL");
    keys.push("LDAP_DOMAIN");
  }
  for (const key of keys) {
    if (!process.env[key]) {
      Logger.error(
        new Error(
          `The ${key} environment variable is required but not defined in .env.\
					https://github.com/ValFraNath/apothiquiz/wiki/Production-deployment`
        )
      );
      needToExit = true;
    }
  }

  if (needToExit) {
    process.exit(1);
  }
}

export default app;
