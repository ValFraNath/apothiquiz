import fs from "fs";
import path from "path";
import { queryPromise } from "../db/database.js";
import app from "../index.js";
let __dirname = path.resolve();

/**
 * Wait until the server and the database are ready, to insert the data and run the tests
 */
before(function insertData(done) {
  app.waitReady(async function () {
    console.log("Insert data in database...");

    const insertionScript = fs.readFileSync(path.resolve(__dirname, "db", "insert_data.sql")).toString("utf8");

    await queryPromise(insertionScript)
      .then(() => {
        console.log("-> Data inserted in database!");
        done();
      })
      .catch((err) => {
        throw err;
      });
  });
});
