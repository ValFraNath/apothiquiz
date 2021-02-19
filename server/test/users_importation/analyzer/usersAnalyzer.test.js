import path from "path";

import chai from "chai";

import {
  analyzeUsers,
  UsersAnalyzerWarning,
} from "../../../global/users_importation/usersAnalyzer.js";
import { parseUsersFromCsv } from "../../../global/users_importation/usersParser.js";

const { expect } = chai;
const FILES_DIR = path.resolve("test", "users_importation", "analyzer", "files");

const tests = [
  {
    file: "students.csv",
    warnings: [
      { code: UsersAnalyzerWarning.DUPLICATE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.TOO_CLOSE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_ADMIN, count: 0 },
    ],
  },
  {
    file: "invalid_admin.csv",
    warnings: [
      { code: UsersAnalyzerWarning.DUPLICATE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.TOO_CLOSE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_ADMIN, count: 3 },
    ],
  },
  {
    file: "invalid_login.csv",
    warnings: [
      { code: UsersAnalyzerWarning.DUPLICATE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_LOGIN, count: 3 },
      { code: UsersAnalyzerWarning.TOO_CLOSE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_ADMIN, count: 0 },
    ],
  },
  {
    file: "duplicates_login.csv",
    warnings: [
      { code: UsersAnalyzerWarning.DUPLICATE_LOGIN, count: 2 },
      { code: UsersAnalyzerWarning.INVALID_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.TOO_CLOSE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_ADMIN, count: 0 },
    ],
  },
  {
    file: "close_logins.csv",
    warnings: [
      { code: UsersAnalyzerWarning.DUPLICATE_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.INVALID_LOGIN, count: 0 },
      { code: UsersAnalyzerWarning.TOO_CLOSE_LOGIN, count: 3 },
      { code: UsersAnalyzerWarning.INVALID_ADMIN, count: 0 },
    ],
  },
  {
    file: "worst.csv",
    warnings: [
      { code: UsersAnalyzerWarning.DUPLICATE_LOGIN, count: 1 },
      { code: UsersAnalyzerWarning.INVALID_LOGIN, count: 3 },
      { code: UsersAnalyzerWarning.TOO_CLOSE_LOGIN, count: 1 },
      { code: UsersAnalyzerWarning.INVALID_ADMIN, count: 2 },
    ],
  },
];

const warningsCounter = (warnings, code) =>
  warnings.reduce((count, warning) => count + (warning.code === code), 0);

describe("Users analyzer", () => {
  for (const test of tests) {
    describe(`File ${test.file}`, () => {
      let users;
      before("Parse file", (done) => {
        parseUsersFromCsv(path.resolve(FILES_DIR, test.file)).then((data) => {
          users = JSON.parse(data);
          done();
        });
      });

      it("Expected warnings", (done) => {
        const warnings = analyzeUsers(users);

        test.warnings.forEach((warning) =>
          expect(warningsCounter(warnings, warning.code), "Type " + warning.code).equals(
            warning.count
          )
        );
        done();
      });
    });
  }
});
