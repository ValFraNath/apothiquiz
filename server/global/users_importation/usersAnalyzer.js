import {
  isString,
  isNumber,
  getDuplicates,
  getTooCloseValues,
  getTooLongValues,
} from "../importationUtils.js";

import { LOGIN_MAX_LENGTH } from "./usersImporter.js";

const LOGIN_MAX_DISTANCE = 2;

/**
 * Analyze a list of users
 * @param {{login,admin}[]} list The user list
 * @returns {UsersAnalyzerWarning[]} The warnings list
 */
export function analyzeUsers(list) {
  const warnings = [];
  const loginList = list.map((user) => user.login);

  const duplicatesLogin = getDuplicates(loginList);
  const tooClosesLogin = getTooCloseValues(loginList, LOGIN_MAX_DISTANCE);
  const invalidLogins = getInvalidLogins(loginList);
  const tooLongLogins = getTooLongValues(loginList, LOGIN_MAX_LENGTH);
  const invalidAdmins = getInvalidAdminProperties(list);

  warnings.push(
    ...duplicatesLogin.map(
      (login) =>
        new UsersAnalyzerWarning(
          UsersAnalyzerWarning.DUPLICATE_LOGIN,
          `Duplication du login "${login}"`
        )
    )
  );

  warnings.push(
    ...invalidLogins.map(
      (login) =>
        new UsersAnalyzerWarning(
          UsersAnalyzerWarning.INVALID_LOGIN,
          `Le login ne doit comporter que des lettres : "${login}"`
        )
    )
  );

  warnings.push(
    ...tooLongLogins.map(
      (login) =>
        new UsersAnalyzerWarning(
          UsersAnalyzerWarning.INVALID_LOGIN,
          `Le login est trop long (max ${LOGIN_MAX_LENGTH}) : "${login}"`
        )
    )
  );

  warnings.push(
    ...tooClosesLogin.map(
      (group) =>
        new UsersAnalyzerWarning(
          UsersAnalyzerWarning.TOO_CLOSE_LOGIN,
          `Ces logins sont très proche : "${group.join('", "')}"`
        )
    )
  );

  warnings.push(
    ...invalidAdmins.map(
      ({ login, admin }) =>
        new UsersAnalyzerWarning(
          UsersAnalyzerWarning.INVALID_ADMIN,
          `Propriété ADMIN invalide (doit être 0 ou 1) pour "${login}" : "${admin}"`
        )
    )
  );

  return warnings;
}

/**
 * Returns the list of users having invalid admin property
 * @param {{login,admin}[]} users
 */
function getInvalidAdminProperties(users) {
  return users.filter(({ admin }) => !isAdminPropertyValid(admin));
}

/**
 * Filter logins to keep only invalid ones
 * @param {any[]} logins The logins list
 * @returns {any[]} The invalid logins
 */
function getInvalidLogins(logins) {
  return logins.filter((login) => !isLoginValid(login));
}

/**
 * Test if a login is valid
 * @param {*} login
 * @returns {boolean}
 */
export function isLoginValid(login) {
  return isString(login) && /^[a-z]+$/i.test(login);
}

/**
 * Test if a admin property is valid
 * @param {*} value
 * @return boolean
 */
export function isAdminPropertyValid(value) {
  return !value || (isNumber(value) && value >= 0 && value <= 1);
}

export class UsersAnalyzerWarning {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

UsersAnalyzerWarning.DUPLICATE_LOGIN = 1;
UsersAnalyzerWarning.TOO_CLOSE_LOGIN = 2;
UsersAnalyzerWarning.INVALID_LOGIN = 3;
UsersAnalyzerWarning.INVALID_ADMIN = 4;
