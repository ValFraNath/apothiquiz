import mysql from "mysql";

export const LOGIN_MAX_LENGTH = 64;

function createSqlToInsertAllUsers(users) {
  let script = "START TRANSACTION; SET AUTOCOMMIT=0; ";

  script += createSqlToClearRemovedUsers(users);

  script += createSqlToInsertOrUpdateUsers(users);

  script += "COMMIT; SET AUTOCOMMIT=1; ";
  return script;
}

/**
 *
 * @param {{login, admin}[]} users
 */
function createSqlToClearRemovedUsers(users) {
  const logins = users.map(({ login }) => mysql.escape(login)).join(", ");
  return `DELETE FROM user WHERE us_login NOT IN (${logins}); `;
}

/**
 *
 * @param {{login, admin}[]} users
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
      login = mysql.escape(login);
      return `INSERT INTO user (us_login,us_admin,us_avatar) \
              VALUES (${login},${admin},${defaultAvatar}) \
              ON DUPLICATE KEY UPDATE us_admin = ${admin}; `;
    })
    .join("");
}

const users = [
  { login: "fpoguet", admin: 0 },
  { login: "nhoun", admin: 0 },
  { login: "vperigno", admin: 0 },
  { login: "pwater", admin: null },
  { login: "fdadeau", admin: 1 },
  { login: "alclairet", admin: 0 },
  { login: "mpudlo", admin: 1 },
];
console.log(createSqlToInsertAllUsers(users));
