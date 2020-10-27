import express from "express";
import dotenv from "dotenv";

import apiRouter from "./routes/api.route.js";
import reactRouter from "./routes/react.route.js";
import dbConn, { db_connection } from "./db/database.js";

dotenv.config();

const PORT = process.env.PORT || 5035;
const app = express();
app.isReady = false;

app.use(express.static("../client/build/"));
app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);

dbConn.on("database_ready", function () {
  app.listen(PORT, () => {
    app.isReady = true;
    console.log(`Server is running on port ${PORT}.`);
  });
});

dbConn.connect(db_connection);

export default app;

/**
 * Check every <interval> ms if the server is ready to use
 * @param callback  The function to call when the server is ready
 * @param interval  The interval between checks
 */
app.waitReady = function (callback, interval = 100) {
  let int = setInterval(() => {
    if (app.isReady && dbConn.isReady) {
      callback();
      clearInterval(int);
    }
  }, interval);
};
