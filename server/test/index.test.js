import fsSync from "fs";
import fs from "fs/promises";
import path from "path";

import chai from "chai";
import chaiHttp from "chai-http";

import { queryPromise } from "../db/database.js";
import { getSortedFiles } from "../global/files.js";
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
export async function forceTruncateTables(...tables) {
  let sql = "SET FOREIGN_KEY_CHECKS = 0; ";
  sql = tables.reduce((sql, table) => sql + `TRUNCATE TABLE ${table} ; `, sql);
  sql += "SET FOREIGN_KEY_CHECKS = 1; ";
  await queryPromise(sql);
}

/**
 * Insert data from a sqcript
 * @param {string} filename The filename
 * @returns {Promise}
 */
export async function insertData(filename) {
  const script = await fs.readFile(path.resolve("test", "required_data", filename), {
    encoding: "utf8",
  });
  await queryPromise(script);
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
export async function getToken(username, password = "1234") {
  const res = await requestAPI("users/login", {
    body: { userPseudo: username, userPassword: password },
    method: "post",
  });

  return res.body.accessToken;
}

/**
 * Reset the configuration data in database
 * @returns {Promise}
 */
export async function resetConfig() {
  const sql = `DELETE FROM server_informations WHERE server_informations.key LIKE 'config%'; `;
  await queryPromise(sql);

  await insertData("config.sql");
}

/**
 * Send request to import files of a given directory
 * @param {string} dir The directory containing files to send
 * @param {string} confirmed Tell if the importation is confirmed
 * @param {string} token The user token
 */
export function importImagesViaAPI(dir, confirmed = "", token = "") {
  return new Promise((resolve, reject) => {
    const req = chai
      .request(app)
      .post("/api/v1/import/images")
      .set("Authorization", token ? "Bearer " + token : "")
      .set("Content-Type", "image/*")
      .field("confirmed", confirmed);

    getSortedFiles(dir).then((files) => {
      files.forEach((file) => {
        req.attach("file", fsSync.readFileSync(path.resolve(dir, file)), file);
      });
      req.end((err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  });
}
