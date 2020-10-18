import express from "express";
import dotenv from "dotenv";

import apiRouter from "./routes/api.route.js";
import reactRouter from "./routes/reactRouter.js";
import db, {create_database_scheme} from "./db/database.js";


dotenv.config();

db.connect((err) => {
  if (err) {
    console.error("Can't connect to the database.");
    throw err;
  }

  create_database_scheme(db);
  console.log("Connected to database!");
});

const PORT = process.env.PORT || 5035;
const app = express();

app.use(express.static("../client/build/"));
app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
