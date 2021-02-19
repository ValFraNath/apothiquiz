import levenshtein from "js-levenshtein";

import { LOGIN_MAX_LENGTH } from "./usersImporter.js";

const LOGIN_MAX_DISTANCE = 1;

/**
 * Analyze a list of users
 * @param {{login,admin}[]} list The user list
 * @returns {UsersAnalyzerWarning[]} The warnings list
 */
export function analyzeUsers(list) {
  const warnings = [];
  const loginList = list.map((user) => user.login);

  const duplicatesLogin = getDuplicates(loginList);
  const tooClosesLogin = getTooCloseLogins(loginList);
  const invalidLogins = getInvalidLogins(loginList);
  const tooLongLogins = getTooLongLogins(loginList);

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

  return warnings;
}

/**
 * Filter logins to keep only invalid ones
 * @param {any[]} logins The logins list
 * @returns {any[]} The invalid logins
 */
function getInvalidLogins(logins) {
  return logins.filter((login) => !isString(login) || !/^[a-z]+$/i.test(login));
}

/**
 * Filter logins to keep too long ones
 * @param {any[]} logins The logins list
 * @returns {any[]} The too long logins
 */
function getTooLongLogins(logins) {
  return logins.filter((login) => isString(login) && login.length > LOGIN_MAX_LENGTH);
}

/**
 * Returns values that appear more than once in the list
 * @param {any[]} values
 * @returns {any[]} non-unique values
 */
function getDuplicates(values) {
  return [...new Set(values.filter((value, i) => values.slice(i + 1).includes(value)))];
}

/**
 * Returns all groups of values that have a distance less than a given one
 * @param {string[]} logins The login list
 * @param {number} minDistance The maximum distance
 * @returns {string[][]}
 */
function getTooCloseLogins(logins) {
  logins = logins.slice();
  const groups = [];

  logins.forEach((value) => {
    if (!isString(value)) {
      return;
    }
    const group = logins.filter((other) => {
      if (!isString(other)) {
        return;
      }
      const distance = levenshtein(other, value);
      return distance <= LOGIN_MAX_DISTANCE && distance > 0;
    });

    const existingGroup = groups.find((egroup) => egroup.some((e) => group.includes(e)));
    if (existingGroup) {
      existingGroup.push(...group, value);
      return;
    }

    if (group.length > 0) {
      groups.push([...group, value]);
    }
  });

  return groups.map((group) => [...new Set(group)]);
}

const isString = (v) => typeof v === "string" || v instanceof String;

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
