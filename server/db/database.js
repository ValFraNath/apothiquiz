import mysql from "mysql";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();

dotenv.config();

const Database = {};

// Be sure to add a new version at the end of this array (it must be sorted)
const versions = [
  "2020-10-18",
  "2020-10-21",
  "2020-10-27",
  "2020-10-31",
  "2020-11-04",
];

Database.currentVersion = () => versions[versions.length - 1];

Database.connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "glowing-octo-guacamole",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "glowingOctoGuacamole",
  multipleStatements: true,
});

Database.isReady = false;

Database.connect = async function (err) {
  if (err) {
    console.error("Can't connect to the database.");
    throw err;
  }
  console.log("Connected to database!");

  Database.getVersion().then(async (db_version) => {
    if (db_version === -1) {
      await Database.create();
      await Database.update();
    } else {
      await Database.update(db_version);
    }

    Database.isReady = true;
    Database.connection.emit("database_ready");
    console.log("Database is ready to use!");
  });
};

Database.create = async function () {
  const creationScript = fs
    .readFileSync(path.resolve(__dirname, "db", "create_database.sql"))
    .toString("utf8");
  console.log("Creation of database... ");
  await queryPromise(creationScript)
    .then(() => console.log("->Database created!\n"))
    .catch((err) => {
      throw err;
    });
};

/**
 * Get the database version
 * @return {Number|String} The database version, or -1 if no version found
 */
Database.getVersion = function () {
  let sql = "SELECT sy_version FROM `system`";

  return new Promise(function (resolve) {
    Database.connection.query(sql, function (err, res) {
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
};

/**
 * Update the database if needed
 * @param {String} version The current database version, if undefined it use the first version
 */
Database.update = async function (version = versions[0]) {
  if (version === Database.currentVersion()) {
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
};

/**
 * Execute a query to database and return a Promise
 * @param sql The sql query
 * @return {Promise<Array>} The result if success, the error otherwise
 */
export async function queryPromise(sql) {
  return new Promise(function (resolve, reject) {
    Database.connection.query(sql, function (err, res) {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
}

export default Database;
