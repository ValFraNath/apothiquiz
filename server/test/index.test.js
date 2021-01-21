import fs from "fs/promises";
import path from "path";

import { queryPromise } from "../db/database.js";
import app from "../index.js";

/**
 * Wait until the server and the database are ready to run tests
 */
before(function insertData(done) {
  app.waitReady(() => done());
});

/**
 * Create the sql script to truncate tables without checks foreign keys constraints
 * @param  {...string} tables
 */
export function forceTruncateTables(...tables) {
  let sql = "SET FOREIGN_KEY_CHECKS = 0; ";
  sql = tables.reduce((sql, table) => sql + `TRUNCATE TABLE ${table} ; `, sql);
  return sql + "SET FOREIGN_KEY_CHECKS = 1; ";
}

export function insertData(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve("test", "required_data", filename), { encoding: "utf8" })
      .then((script) => queryPromise(script).then(() => resolve()))
      .catch(reject);
  });
}
