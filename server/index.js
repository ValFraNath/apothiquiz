import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";

import apiRouter from "./routes/api.route.js";
import reactRouter from "./routes/react.route.js";
import RequestSyntaxErrorHandler from "./middlewares/error.middleware.js";
import Database from "./db/database.js";
import { logError } from "./global/ErrorLogger.js";

dotenv.config();

const PORT = process.env.PORT || 5035;
const app = express();
app.isReady = false;

if (!process.env.TOKEN_PRIVATE_KEY) {
  logError(new Error("TOKEN_PRIVATE_KEY is not defined in .env. Please generate a random private key"));
  process.exit(1);
}

app.use(bodyParser.json());

app.use(express.static("../client/build/"));
app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);
app.use(RequestSyntaxErrorHandler);

Database.connect()
  .then(() => {
    app.listen(PORT, () => {
      app.isReady = true;
      console.info(`Server is running on port ${PORT}.`);
    });
  })
  .catch(() => process.exit(1));

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
