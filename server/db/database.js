import mysql from "mysql";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { logError } from "../global/ErrorLogger.js";

const __dirname = path.resolve();

dotenv.config();

// Be sure to add a new version at the end of this array (it must be sorted)
const versions = [
  "2021-01-08",
  "2021-01-14",
  "2021-01-16",
  "2021-01-21",
  "2021-01-25",
  "2021-01-26",
];

/**
 * Get the current API version
 * @returns {string} The version "YYYY-MM-DD"
 */
export const currentAPIVersion = () => versions[versions.length - 1];

export const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "glowing-octo-guacamole",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "glowingOctoGuacamole",
  multipleStatements: true,
});

/**
 * Connect the server to the database
 */
function connect() {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        logError(err, "Can't connect to the database");
        return reject();
      }
      console.log("Connected to database!");

      getSystemInformation("api_version").then((db_version) => {
        if (db_version === null) {
          create()
            .then(() =>
              update()
                .then(() => resolve())
                .catch(reject)
            )
            .catch(reject);
        } else {
          update(db_version)
            .then(() => resolve())
            .catch(reject);
        }
      });
    });
  });
}

/**
 * Create the database
 */
function create() {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve("db", "create_database.sql"), { encoding: "utf-8" }).then((script) => {
      console.info("Creation of database... ");
      queryPromise(script)
        .then(() => {
          console.info("-> Database created!");
          resolve();
        })
        .catch((err) => {
          logError(err, "Can't create the database");
          reject();
        });
    });
  });
}

/**
 * Get a system information from the database
 *
 * @param {String} key the name of the information
 * @return {Promise<Number|String|null>} The value of the information, or null if the information is not found
 */
export function getSystemInformation(key) {
  return new Promise(function (resolve, reject) {
    const sql = "SELECT value   \
       FROM server_informations \
       WHERE `key` = ? ;";

    queryPromise(sql, [key])
      .then((res) => {
        if (res[0] && res[0].value) {
          resolve(res[0].value);
        } else {
          resolve(null);
        }
      })
      .catch((error) => {
        if (error.code === "ER_NO_SUCH_TABLE") {
          resolve(null);
        } else {
          logError(error, "Can't get data information");
          reject();
        }
      });
  });
}

/**
 * Update the database if needed
 * @param {String} version The current database version, if undefined it use the first version
 */
function update(version = versions[0]) {
  return new Promise((resolve, reject) => {
    if (version === currentAPIVersion()) {
      console.info("Database is up to date!");
      return resolve();
    }

    if (!versions.includes(version)) {
      logError(new Error("Invalid database version found"));
      return reject();
    }

    let i = versions.indexOf(version) + 1;
    (function updateRecursively() {
      if (i === versions.length) {
        console.info("-> Database updated!\n");
        return resolve();
      }
      console.info(`Update database from ${versions[i - 1]} to ${versions[i]}... `);
      fs.readFile(
        path.resolve(
          __dirname,
          "db",
          "updates",
          `db_${versions[i - 1].split("-").join("")}_to_${versions[i].split("-").join("")}.sql`
        ),
        { encoding: "utf-8" }
      )
        .then((script) =>
          queryPromise(script)
            .then(() => {
              i++;
              updateRecursively();
            })
            .catch((err) => {
              logError(err, "Can't update the database");
              reject();
            })
        )
        .catch((error) => {
          logError(error, "Can't read the update file");
          reject();
        });
    })();
  });
}

/**
 * Execute a query to database and return a Promise
 * @param {String} sql The sql query
 * @param {Array<String>|Object} values? optional values to be given put into the request placeholders
 * @return {Promise<Array>} The result if success, the error otherwise
 */
export function queryPromise(sql, values = []) {
  return new Promise(function (resolve, reject) {
    connection.query(sql, values, function (err, res) {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
}

/**
 * Custom query format
 * If values is an array -> all "?" are replaced by values in the same order
 * If values is an object -> values replace identifiers in the format :id
 * @param {string} query The sql query
 * @param {object|string[]} values The escaped values
 * @returns {string} The fully escaped query
 */
connection.config.queryFormat = function (query, values) {
  if (!values) {
    return query;
  }

  if (values instanceof Array) {
    values = values.slice();
    while (query.includes("?") && values.length > 0) {
      query = query.replace("?", this.escape(values.shift()));
    }
    return query;
  }

  return query.replace(
    /:(\w+)/g,
    function (identifier, key) {
      if (Object.getOwnPropertyNames(values).includes(key)) {
        return this.escape(values[key]);
      }
      return identifier;
    }.bind(this)
  );
};

export default { connect };
