import path from "path";

import chai from "chai";

import { USER_WARNINGS } from "../../../../global/importation/users-importation/UsersList.js";
import { parseUsersFromCsv } from "../../../../global/importation/users-importation/usersParser.js";
const { expect } = chai;
const FILES_DIR = path.resolve(
  "test",
  "importation-test",
  "users-importation",
  "analyzer",
  "files"
);

const tests = [
  {
    file: "students.csv",
    warnings: [
      { code: USER_WARNINGS.DUPLICATED_LOGINS, count: 0 },
      { code: USER_WARNINGS.TOO_CLOSE_LOGINS, count: 0 },
      { code: USER_WARNINGS.INVALID_LOGIN, count: 0 },
      { code: USER_WARNINGS.NO_ADMIN, count: 0 },
      { code: USER_WARNINGS.NO_USER, count: 0 },
    ],
  },
  {
    file: "invalid_login.csv",
    warnings: [
      { code: USER_WARNINGS.DUPLICATED_LOGINS, count: 0 },
      { code: USER_WARNINGS.TOO_CLOSE_LOGINS, count: 0 },
      { code: USER_WARNINGS.INVALID_LOGIN, count: 2 },
      { code: USER_WARNINGS.NO_ADMIN, count: 0 },
      { code: USER_WARNINGS.NO_USER, count: 0 },
    ],
  },
  {
    file: "duplicates_login.csv",
    warnings: [
      { code: USER_WARNINGS.DUPLICATED_LOGINS, count: 2 },
      { code: USER_WARNINGS.TOO_CLOSE_LOGINS, count: 0 },
      { code: USER_WARNINGS.INVALID_LOGIN, count: 0 },
      { code: USER_WARNINGS.NO_ADMIN, count: 0 },
      { code: USER_WARNINGS.NO_USER, count: 0 },
    ],
  },
  {
    file: "close_logins.csv",
    warnings: [
      { code: USER_WARNINGS.DUPLICATED_LOGINS, count: 0 },
      { code: USER_WARNINGS.TOO_CLOSE_LOGINS, count: 3 },
      { code: USER_WARNINGS.INVALID_LOGIN, count: 0 },
      { code: USER_WARNINGS.NO_ADMIN, count: 0 },
      { code: USER_WARNINGS.NO_USER, count: 0 },
    ],
  },
  {
    file: "worst.csv",
    warnings: [
      { code: USER_WARNINGS.DUPLICATED_LOGINS, count: 1 },
      { code: USER_WARNINGS.TOO_CLOSE_LOGINS, count: 1 },
      { code: USER_WARNINGS.INVALID_LOGIN, count: 2 },
      { code: USER_WARNINGS.NO_ADMIN, count: 1 },
      { code: USER_WARNINGS.NO_USER, count: 0 },
    ],
  },
  {
    file: "no_users.csv",
    warnings: [
      { code: USER_WARNINGS.DUPLICATED_LOGINS, count: 0 },
      { code: USER_WARNINGS.TOO_CLOSE_LOGINS, count: 0 },
      { code: USER_WARNINGS.INVALID_LOGIN, count: 0 },
      { code: USER_WARNINGS.NO_ADMIN, count: 1 },
      { code: USER_WARNINGS.NO_USER, count: 1 },
    ],
  },
  {
    file: "no_admins.csv",
    warnings: [
      { code: USER_WARNINGS.DUPLICATED_LOGINS, count: 0 },
      { code: USER_WARNINGS.TOO_CLOSE_LOGINS, count: 0 },
      { code: USER_WARNINGS.INVALID_LOGIN, count: 0 },
      { code: USER_WARNINGS.NO_ADMIN, count: 1 },
      { code: USER_WARNINGS.NO_USER, count: 0 },
    ],
  },
];

const warningsCounter = (warnings, code) =>
  warnings.reduce((count, warning) => count + (warning.code === code), 0);

describe("Users analyzer", () => {
  for (const test of tests) {
    describe(`File ${test.file}`, () => {
      let users;
      before("Parse file", async () => {
        users = await parseUsersFromCsv(path.resolve(FILES_DIR, test.file));
      });

      it("Expected warnings", (done) => {
        const warnings = users.analyze();

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
