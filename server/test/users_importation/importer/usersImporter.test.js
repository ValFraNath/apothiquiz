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
      before("Clear users and their data", function (done) {
        this.timeout(10000);
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
  before("Clear users and their data", function (done) {
    this.timeout(10000);
    forceTruncateTables("user", "results", "duel").then(() => done());
  });

  before("Insert users", async () => {
    const script = await parseAndCreateSqlToInsertAllUsers(path.resolve(FILES_DIR, "students.csv"));
    await queryPromise(script);
  });

  before("Create duels", (done) => {
    const users = ["nhoun", "vperigno", "fdadeau", "fpoguet", "mpudlo"];
    Promise.all(
      users.map((user, i) =>
        Promise.all(
          users
            .slice(i + 1)
            .map((other) =>
              queryPromise("CALL createDuel(?,?,?);", [user, other, JSON.stringify(["questions"])])
            )
        )
      )
    ).then(() => done());
  });

  it("Good deleted users", async () => {
    const script = await parseAndCreateSqlToInsertAllUsers(path.resolve(FILES_DIR, "small.csv"));
    await queryPromise(script);

    const res = await queryPromise("SELECT us_login, us_admin, us_deleted FROM user");
    const users = res.filter((u) => !u.us_deleted).map((u) => u.us_login);
    expect(users).deep.equalInAnyOrder(["fpoguet", "nhoun", "vperigno", "fdadeau", "alclairet"]);

    const deleted = res.filter((u) => u.us_deleted).map((u) => u.us_login);
    expect(deleted).deep.equalInAnyOrder(["pwater", "mpudlo"]);

    const isAdmin = (
      await queryPromise("SELECT us_admin FROM user WHERE us_login = ?", ["mpudlo"])
    )[0].us_admin;

    expect(isAdmin).equals(0);
  });

  it("Duel deleted with users", async () => {
    let res = await queryPromise("CALL getDuelsOf(?)", ["pwater"]);
    expect(res[0]).to.have.length(0);

    res = await queryPromise("SELECT COUNT(*) as count FROM results WHERE us_login = 'mpudlo'");
    expect(res[0].count).equals(0);

    res = await queryPromise("CALL getDuelsOf(?)", ["nhoun"]);
    expect(res[0]).to.have.length(6);

    res = await queryPromise("SELECT COUNT(*) AS count FROM duel");

    expect(res[0].count).equals(6);
  });
});
