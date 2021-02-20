import dateFormat from "dateformat";
import mysql from "mysql";

import { parseUsersFromCsv } from "./usersParser.js";

export const LOGIN_MAX_LENGTH = 32;

/**
 * Parse a file and create script to import all users
 * @param {string} filepath The file to parse
 * @returns {Promise<string>} The script
 */
export function parseAndCreateSqlToInsertAllUsers(filepath) {
  return new Promise((resolve, reject) => {
    parseUsersFromCsv(filepath)
      .then((json) => {
        resolve(createSqlToInsertAllUsers(JSON.parse(json)));
      })
      .catch(reject);
  });
}

/**
 * Create script to import new users
 * @param {{login,admin}[]} users The imported users list
 * @returns {string} The sql script
 */
export function createSqlToInsertAllUsers(users) {
  const script = "START TRANSACTION; SET AUTOCOMMIT=0; "
    + createSqlToClearRemovedUsers(users)
    + createSqlToInsertOrUpdateUsers(users)
    + "COMMIT; SET AUTOCOMMIT=1; ";

  return script;
}

/**
 * Create script to delete all users that have not been reimported
 * @param {{login, admin}[]} users The imported users list
 * @returns {string} The sql script
 */
function createSqlToClearRemovedUsers(users) {
  let logins = users
    .map(({ login }) => mysql.escape(String(login).substr(0, LOGIN_MAX_LENGTH).toLowerCase()))
    .join(", ");

  if (logins.length === 0) {
    logins = ["''"];
  }
  const date = mysql.escape(dateFormat(new Date(), "yyyy-mm-dd"));
  return `  DELETE FROM duel \
            WHERE EXISTS (  SELECT * \
                            FROM results \
                            WHERE results.du_id = duel.du_id \
                            AND results.us_login NOT IN (${logins}) ); \
            UPDATE user \
            SET us_deleted = ${date}, us_admin = 0 \
            WHERE us_login NOT IN (${logins}); `;
}

/**
 * Create sql script to insert or update in database all imported users
 * @param {{login, admin}[]} users The imported users list
 * @returns {string} The sql script
 */
function createSqlToInsertOrUpdateUsers(users) {
  const defaultAvatar = mysql.escape(
    JSON.stringify({
      eyes: 0,
      hands: 0,
      hat: 0,
      mouth: 0,
      colorBody: "#0c04fc",
      colorBG: "#D3D3D3",
    })
  );

  return users
    .map(({ login, admin }) => {
      admin = mysql.escape(admin === 1 ? 1 : 0);
      login = mysql.escape(String(login).substr(0, LOGIN_MAX_LENGTH).toLowerCase());
      return `INSERT INTO user (us_login,us_admin,us_avatar) \
              VALUES (${login},${admin},${defaultAvatar}) \
              ON DUPLICATE KEY UPDATE us_admin = ${admin}, us_deleted = NULL; `;
    })
    .join("");
}
