import mysql from "mysql";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();

dotenv.config();

// Be sure to add a new version at the end of this array (it must be sorted)
const versions = ["2020-10-17", "2020-10-18", "2020-10-19", "2020-10-20"];

const currentVersion = () => versions[versions.length - 1];

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "glowing-octo-guacamole",
  password: process.env.DB_PASSWORD || "p@ssword",
  database: process.env.DB_DATABASE || "glowingOctoGuacamole",
  multipleStatements: true,
});

export default db;

export async function db_connection(err) {
  if (err) {
    console.error("Can't connect to the database.");
    throw err;
  }
  console.log("Connected to database!");

  getDatabaseVersion().then(async (db_version) => {
    if (db_version === -1) {
      await create_database(db);
      await update();
    } else {
      await update(db_version);
    }
    console.log("Database is ready to use!");
  });
}

/**
 * Execute the script of database creation
 */
export async function create_database() {
  const creationScript = fs
    .readFileSync(path.resolve(__dirname, "db", "create_database.sql"))
    .toString("utf8");
  console.log("Creation of database... ");
  await querySync(creationScript)
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
    db.query(sql, function (err, res) {
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
export async function update(version = versions[0]) {
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

    await querySync(updateQuery)
      .then(() => console.log("->Database updated!\n"))
      .catch((err) => {
        throw err;
      });
  }
}

/**
 * Execute synchronous query to database
 * @param sql The sql query
 * @return {Promise<unknown>} The result if success, the error otherwise
 */
async function querySync(sql) {
  return new Promise(function (resolve, reject) {
    db.query(sql, function (err, res) {
      if (err) {
        reject(err);
      }

      resolve(res);
    });
  });
}
