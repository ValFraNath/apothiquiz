import fs from "fs/promises";
import path from "path";
import app from "../index.js";
import { queryPromise } from "../db/database.js";

/**
 * Wait until the server and the database are ready to run tests
 */
before((done) => {
  app.waitReady(() => done());
});

/**
 * Truncate the given table
 * @param  {...string} tables The tables to truncate
 * @returns {Promise}
 */
export function forceTruncateTables(...tables) {
  return new Promise((resolve, reject) => {
    let sql = "SET FOREIGN_KEY_CHECKS = 0; ";
    sql = tables.reduce((sql, table) => sql + `TRUNCATE TABLE ${table} ; `, sql);
    sql += "SET FOREIGN_KEY_CHECKS = 1; ";
    queryPromise(sql)
      .then(() => resolve())
      .catch(reject);
  });
}

/**
 * Insert data from a sqcript
 * @param {string} filename The filename
 * @returns {Promise}
 */
export function insertData(filename) {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve("test", "required_data", filename), { encoding: "utf8" })
      .then((script) => queryPromise(script).then(() => resolve()))
      .catch(reject);
  });
}
