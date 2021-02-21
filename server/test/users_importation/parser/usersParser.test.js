import path from "path";

import chai from "chai";
import equalInAnyOrder from "deep-equal-in-any-order";
import mocha from "mocha";

import { parseUsersFromCsv } from "../../../global/users_importation/usersParser.js";

chai.use(equalInAnyOrder);
const { expect } = chai;
const { describe, it, before } = mocha;
const FILES_DIR = path.resolve("test", "users_importation", "parser", "files");

const tests = [
  {
    file: "students.csv",
    expecation: [
      { login: "fpoguet", admin: 0 },
      { login: "nhoun", admin: 0 },
      { login: "vperigno", admin: 0 },
      { login: "pwater", admin: null },
      { login: "fdadeau", admin: 1 },
      { login: "alclairet", admin: 0 },
      { login: "mpudlo", admin: 1 },
    ],
  },
];

for (const test of tests) {
  describe("Users parser", () => {
    let users;
    before("Parse file", (done) => {
      parseUsersFromCsv(path.resolve(FILES_DIR, test.file)).then((list) => {
        users = JSON.parse(list);
        done();
      });
    });

    it("Good list of users", () => {
      expect(users).to.be.deep.equalInAnyOrder(test.expecation);
    });
  });
}
