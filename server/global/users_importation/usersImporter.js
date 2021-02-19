import { createSqlToInsertInto } from "../importationUtils.js";

export const LOGIN_MAX_LENGTH = 64;

function createSqlToInsertAllUsers(users) {
  let script = "START TRANSACTION; SET AUTOCOMMIT=0;";

  script += "COMMIT; SET AUTOCOMMIT=1;";
  return script;
}

function createSqlToClearRemovedUsers(users) {}
