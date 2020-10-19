import express from "express";
import dotenv from "dotenv";

import apiRouter from "./routes/api.route.js";
import reactRouter from "./routes/reactRouter.js";
import dbConn, { db_connection } from "./db/database.js";

dotenv.config();

dbConn.connect(db_connection);

const PORT = process.env.PORT || 5035;
const app = express();

app.use(express.static("../client/build/"));
app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);

dbConn.on("database_ready", function () {
  app.listen(PORT, () => {
    app.emit("app_started");
    console.log(`Server is running on port ${PORT}.`);
  });
});

export default app;
