import fs from "fs/promises";
import path from "path";

import chai from "chai";
import chaiHttp from "chai-http";

import { queryPromise } from "../db/database.js";
import app from "../index.js";

chai.use(chaiHttp);

/**
 * Wait until the server and the database are ready to run tests
 */
before("Wait until the database is ready", function (done) {
  this.timeout(10000);
  app.waitReady(() => done());
});

before("Insert configuration data", (done) => {
  resetConfig().then(() => done());
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

/**
 * Make a request to the api
 * @param {string} endpoint The endpoint
 * @param {{body? : object, token? : string, method? : string}} param1 The request option
 * @returns {Promise} The request sql response
 */
export function requestAPI(endpoint, { body = {}, token = "", method = "get" } = {}) {
  return new Promise((resolve, reject) => {
    chai
      .request(app)
      // eslint-disable-next-line no-unexpected-multiline
      [method]("/api/v1/" + endpoint)
      .set("Authorization", token ? "Bearer " + token : "")
      .send(body)
      .end(async (err, res) => {
        if (err) {
          reject(err);
        }
        resolve(res);
      });
  });
}

/**
 * Get a token for a user
 * @param {string} username The user login
 * @param {string} password The user password
 * @returns {Promise<string>} The token
 */
export function getToken(username, password = "1234") {
  return new Promise((resolve, reject) => {
    requestAPI("users/login", {
      body: { userPseudo: username, userPassword: password },
      method: "post",
    })
      .then((res) => resolve(res.body.token))
      .catch(reject);
  });
}

/**
 * Reset the configuration data in database
 * @returns {Promise}
 */
export function resetConfig() {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM server_informations WHERE server_informations.key LIKE 'config%'; `;
    queryPromise(sql)
      .then(() => resolve())
      .catch(reject);
  });
}
