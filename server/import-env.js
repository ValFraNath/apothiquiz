import dotenv from "dotenv";

import Logger from "./global/Logger.js";
dotenv.config({ path: "../.env" });

/**
 * Verify that all required environment variables are defined
 * Otherwise, the process is stopped
 */
let needToExit = false;
const keys = [
  "APOTHIQUIZ_ACCESS_TOKEN_KEY",
  "APOTHIQUIZ_REFRESH_TOKEN_KEY",
  "APOTHIQUIZ_DB_HOST",
  "APOTHIQUIZ_DB_USER",
  "APOTHIQUIZ_DB_PASSWORD",
  process.env.NODE_ENV === "test" ? "APOTHIQUIZ_DB_DATABASE_TEST" : "APOTHIQUIZ_DB_DATABASE",
];
if (process.env.NODE_ENV === "production") {
  keys.push("APOTHIQUIZ_LDAP_URL");
  keys.push("APOTHIQUIZ_LDAP_DOMAIN");
}

for (const key of keys) {
  if (!process.env[key]) {
    Logger.error(
      new Error(
        `The ${key} environment variable is required but not defined in .env.\
					https://github.com/ValFraNath/apothiquiz/wiki/Production-deployment`
      )
    );
    needToExit = true;
  }
}

if (needToExit) {
  process.exit(1);
}
