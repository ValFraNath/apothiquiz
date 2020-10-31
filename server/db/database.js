import mysql from "mysql";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();

dotenv.config();

// Be sure to add a new version at the end of this array (it must be sorted)
const versions = ["2020-10-18", "2020-10-21", "2020-10-27", "2020-10-31"];

export const currentVersion = () => versions[versions.length - 1];

const dbConn = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "glowing-octo-guacamole",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "glowingOctoGuacamole",
  multipleStatements: true,
});

export default dbConn;
dbConn.isReady = false;

/**
 * Connect the server to the database
 */
export async function db_connection(err) {
  if (err) {
    console.error("Can't connect to the database.");
    throw err;
  }
  console.log("Connected to database!");

  getDatabaseVersion().then(async (db_version) => {
    if (db_version === -1) {
      await create_database();
      await update();
    } else {
      await update(db_version);
    }

    dbConn.isReady = true;
    dbConn.emit("database_ready");
    console.log("Database is ready to use!");
  });
}

/**
 * Execute the script of database creation
 */
async function create_database() {
  const creationScript = fs
    .readFileSync(path.resolve(__dirname, "db", "create_database.sql"))
    .toString("utf8");
  console.log("Creation of database... ");
  await queryPromise(creationScript)
    .then(() => console.log("->Database created!\n"))
    .catch((err) => {
      throw err;
    });
}

/**
 * Get the database version
 * @return {Number|String} The database version, or -1 if no version found
 */
export async function getDatabaseVersion() {
  let sql = "SELECT sy_version FROM `system`";

  return new Promise(function (resolve) {
    dbConn.query(sql, function (err, res) {
      if (err) {
        if (err.code === "ER_NO_SUCH_TABLE") {
          resolve(-1);
        } else {
          throw err;
        }
      } else {
        resolve(JSON.parse(JSON.stringify(res))[0].sy_version);
      }
    });
  });
}

/**
 * Update the database if needed
 * @param {String} version The current database version, if undefined it use the first version
 */
async function update(version = versions[0]) {
  if (version === currentVersion()) {
    console.log("Database is up to date!");
    return;
  }

  if (!versions.includes(version)) {
    throw new Error("The database version doesn't exist in the versions array");
  }

  for (let i = versions.indexOf(version) + 1; i < versions.length; ++i) {
    const updateQuery = fs
      .readFileSync(
        path.resolve(
          __dirname,
          "db",
          "updates",
          `db_${versions[i - 1].split("-").join("")}_to_${versions[i]
            .split("-")
            .join("")}.sql`
        )
      )
      .toString("utf8");

    console.log(
      `Update database from ${versions[i - 1]} to ${versions[i]}... `
    );

    await queryPromise(updateQuery)
      .then(() => console.log("->Database updated!\n"))
      .catch((err) => {
        throw err;
      });
  }
}

/**
 * Execute a query to database and return a Promise
 * @param sql The sql query
 * @return {Promise<Array>} The result if success, the error otherwise
 */
export async function queryPromise(sql) {
  return new Promise(function (resolve, reject) {
    dbConn.query(sql, function (err, res) {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
}
