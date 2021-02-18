import levenshtein from "js-levenshtein";

import { LOGIN_MAX_LENGTH } from "./usersImporter.js";

const LOGIN_MAX_DISTANCE = 2;

export function analyzeUsers(list) {
  const warnings = [];
  const loginList = list.map((user) => user.login);
  const duplicatesLogin = getDuplicates(loginList);

  warnings.push(...loginList.map(isLoginValid));

  return warnings;
}

/**
 * Check if a login is valid
 * @param {string} login The login
 * @returns {UsersAnalyzerWarning[]} The warnings
 */
function isLoginValid(login) {
  if (!isString(login)) {
    return [
      new UsersAnalyzerWarning(
        UsersAnalyzerWarning.INVALID_LOGIN,
        `Le login doit être une chaine de caractère : "${login}"`
      ),
    ];
  }
  const warnings = [];

  if (login.length > LOGIN_MAX_LENGTH) {
    warnings.push(
      new UsersAnalyzerWarning(
        UsersAnalyzerWarning.INVALID_LOGIN,
        `Le login est trop long (max ${LOGIN_MAX_LENGTH}) : "${login}"`
      )
    );
  }

  if (/^[a-z]+$/i.test(login)) {
    warnings.push(
      new UsersAnalyzerWarning(
        UsersAnalyzerWarning.INVALID_LOGIN,
        `Le login ne doit contenir que des lettres : "${login}"`
      )
    );
  }
}

/**
 * Returns values that appear more than once in the list
 * @param {any[]} values
 * @returns {any[]} non-unique values
 */
function getDuplicates(values) {
  return [...new Set(values.filter((value, i) => values.slice(i + 1).includes(value)))];
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
