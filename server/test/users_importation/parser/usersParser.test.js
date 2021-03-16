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
      { login: "fpoguet", isAdmin: 0 },
      { login: "nhoun", isAdmin: 0 },
      { login: "vperigno", isAdmin: 0 },
      { login: "pwater", isAdmin: null },
      { login: "fdadeau", isAdmin: 1 },
      { login: "alclairet", isAdmin: 0 },
      { login: "mpudlo", isAdmin: 1 },
    ],
  },
];

for (const test of tests) {
  describe("Users parser", () => {
    let users;
    before("Parse file", async () => {
      const usersList = await parseUsersFromCsv(path.resolve(FILES_DIR, test.file));
      users = JSON.parse(usersList.toJSON());
    });

    it("Good list of users", () => {
      expect(users).to.be.deep.equalInAnyOrder(test.expecation);
    });
  });
}
