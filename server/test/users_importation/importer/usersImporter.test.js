import path from "path";

import chai from "chai";

import equalInAnyOrder from "deep-equal-in-any-order";

import { queryPromise } from "../../../db/database.js";
import { parseAndCreateSqlToInsertAllUsers } from "../../../global/users_importation/usersImporter.js";
import { forceTruncateTables } from "../../index.test.js";

import { expectations } from "./expectations.js";

chai.use(equalInAnyOrder);
const { expect } = chai;
const FILES_DIR = path.resolve("test", "users_importation", "importer", "files");

const tests = [
  {
    file: "students.csv",
    expectation: expectations.students,
  },
  {
    file: "duplicates_login.csv",
    expectation: expectations.duplicates,
  },
  {
    file: "invalid_login.csv",
    expectation: expectations.invalidLogins,
  },
  {
    file: "invalid_admin.csv",
    expectation: expectations.invalidAdmins,
  },
  {
    file: "worst.csv",
    expectation: expectations.worst,
  },
];

describe("Users Importer", () => {
  for (const test of tests) {
    describe(`File ${test.file}`, () => {
      before("Clear users and their data", (done) => {
        forceTruncateTables("user", "results", "duel").then(() => done());
      });

      it("Insert users", async () => {
        const script = await parseAndCreateSqlToInsertAllUsers(path.resolve(FILES_DIR, test.file));
        await queryPromise(script);
      });

      it("Good users", async () => {
        const res = await queryPromise("SELECT us_login FROM user;");
        const users = res.map((u) => u.us_login);
        expect(users).deep.equalInAnyOrder(test.expectation.users);
      });

      it("Good admins", async () => {
        const res = await queryPromise("SELECT us_login FROM user WHERE us_admin = 1;");
        const admins = res.map((u) => u.us_login);
        expect(admins).deep.equalInAnyOrder(test.expectation.admins);
      });

      it("No deleted users", async () => {
        const res = await queryPromise("SELECT us_login FROM user WHERE us_deleted IS NOT NULL;");
        const admins = res.map((u) => u.us_login);
        expect(admins).to.have.length(0);
      });
    });
  }
});

describe("Users deleted after new import", () => {
  before("Clear users and their data", (done) => {
    forceTruncateTables("user", "results", "duel").then(() => done());
  });

  before("Insert users", async () => {
    const script = await parseAndCreateSqlToInsertAllUsers(path.resolve(FILES_DIR, "students.csv"));
    await queryPromise(script);
  });

  // TODO create full duels

  it("Good deleted users", async () => {
    const script = await parseAndCreateSqlToInsertAllUsers(path.resolve(FILES_DIR, "small.csv"));
    await queryPromise(script);

    const res = await queryPromise("SELECT us_login, us_admin, us_deleted FROM user");
    const users = res.filter((u) => !u.us_deleted).map((u) => u.us_login);
    expect(users).deep.equalInAnyOrder(["fpoguet", "nhoun", "vperigno", "fdadeau", "alclairet"]);

    const deleted = res.filter((u) => u.us_deleted).map((u) => u.us_login);
    expect(deleted).deep.equalInAnyOrder(["pwater", "mpudlo"]);
  });

  // TODO test deleted duels
});
