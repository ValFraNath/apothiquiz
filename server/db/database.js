import fs from "fs/promises";
import path from "path";

import dotenv from "dotenv";
import mysql from "mysql";

import Logger from "../global/Logger.js";

const __dirname = path.resolve();

const UPDATES_FILES_DIR = path.resolve(__dirname, "db", "updates");

dotenv.config();

// Be sure to add a new version at the end of this array (it must be sorted)
const versions = [
  "2021-01-08",
  "2021-01-14",
  "2021-01-16",
  "2021-01-21",
  "2021-01-25",
  "2021-01-26",
  "2021-02-11",
  "2021-02-19",
  "2021-02-22",
  "2021-03-02",
  "2021-03-06",
  "2021-03-11",
];

/**
 * Get the current API version
 * @returns {string} The version "YYYY-MM-DD"
 */
export const currentAPIVersion = () => versions[versions.length - 1];

export const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "guacamoleUser",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "guacamoleDb",
  multipleStatements: true,
});

/**
 * Connect the server to the database and update it
 */
async function start() {
  await connect();
  Logger.info("Connected to database!");

  const dbVersion = await getSystemInformation("api_version");

  if (dbVersion === null) {
    await create();
    await update();
  } else {
    await update(dbVersion);
  }
}

/**
 * Connect the server to the database
 */
async function connect() {
  return new Promise((resolve, reject) => {
    connection.connect((error) => {
      if (error) {
        return reject(error);
      }
      resolve();
    });
  });
}

/**
 * Create the database
 */
async function create() {
  const script = await fs.readFile(path.resolve("db", "create_database.sql"), {
    encoding: "utf-8",
  });

  Logger.info("Creation of database... ");

  await queryPromise(script);

  Logger.info("-> Database created!");
}

/**
 * Get a system information from the database
 *
 * @param {String} key the name of the information
 * @return {Promise<Number|String|null>} The value of the information, or null if the information is not found
 */
export async function getSystemInformation(key) {
  const sql = "SELECT value   \
       FROM server_informations \
       WHERE `key` = ? ;";

  try {
    const res = await queryPromise(sql, [key]);
    if (res[0] && res[0].value) {
      return res[0].value;
    }
    return null;
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return null;
    }
    throw error;
  }
}

/**
 * Update the database if needed
 * @param {String} version The current database version, if undefined it use the first version
 */
async function update(version = versions[0]) {
  if (version === currentAPIVersion()) {
    Logger.info("Database is up to date!");
    return;
  }

  if (!versions.includes(version)) {
    throw new Error("Invalid database version found");
  }

  let i = versions.indexOf(version) + 1;

  while (i < versions.length) {
    Logger.info(`Update database from ${versions[i - 1]} to ${versions[i]}... `);

    const updateFileName = `db_${versions[i - 1].split("-").join("")}_to_${versions[i]
      .split("-")
      .join("")}.sql`;

    const script = await fs.readFile(path.resolve(UPDATES_FILES_DIR, updateFileName), {
      encoding: "utf-8",
    });

    await queryPromise(script);
    i++;
  }

  Logger.info("-> Database updated!\n");
  return;
}

/**
 * Execute a query to database and return a Promise
 * @param {String} sql The sql query
 * @param {Array<String>|Object} values? optional values to be given put into the request placeholders
 * @return {Promise<Array>} The result if success, the error otherwise
 */
export async function queryPromise(sql, values = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (error, res) => {
      if (error) {
        return reject(error);
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
export function queryFormat(query, values) {
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
        return mysql.escape(values[key]);
      }
      return identifier;
    }.bind(this)
  );
}

connection.config.queryFormat = queryFormat;

export default { start };
