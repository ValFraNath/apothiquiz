import express from "express";
import dotenv from "dotenv";
import apiRouter from "./routes/api.route.js";
import mysql from "mysql";

import reactRouter from "./routes/reactRouter.js";

dotenv.config();
const PORT = process.env.PORT || 5035;

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "glowing-octo-guacamole",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "glowingOctoGuacamole",
});

db.connect((err) => {
  if (err) {
    console.log("Can't connect to the database.");
    throw err;
  }

  console.log("Connected to database!");
});

const app = express();
app.use(express.static("../client/build/"));

app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
