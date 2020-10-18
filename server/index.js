import express from "express";
import dotenv from "dotenv";

import apiRouter from "./routes/api.route.js";
import reactRouter from "./routes/reactRouter.js";
import db, {create_database, getDatabaseVersion, update} from "./db/database.js";

async function db_connection(err){
  if (err) {
    console.error("Can't connect to the database.");
    throw err;
  }
  console.log("Connected to database!")

  getDatabaseVersion().then(async db_version => {
    if(db_version === -1){
      await create_database(db);
      await update("2020-10-17");
    }else{
      await update(db_version);
    }
  })

}

dotenv.config();

db.connect(db_connection);


const PORT = process.env.PORT || 5035;
const app = express();

app.use(express.static("../client/build/"));
app.use("/api/v1/", apiRouter);
app.use("/", reactRouter);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}.`));

export default app;
