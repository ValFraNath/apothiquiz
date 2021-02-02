import fs from "fs";
import path from "path";

import chai from "chai";
import chaiHttp from "chai-http";
import mocha from "mocha";

import app from "../../index.js";
import { forceTruncateTables, insertData, requestAPI } from "../index.test.js";

const { expect } = chai;
const { describe, it, before } = mocha;
chai.use(chaiHttp);
const __dirname = path.resolve("test", "molecules_importation_route");

describe("Import molecule", () => {
  let mytoken;
  before("Insert users data & get token", (done) => {
    forceTruncateTables("user").then(() =>
      insertData("users.sql").then(async () => {
        const res = await requestAPI("users/login", {
          body: { userPseudo: "fpoguet", userPassword: "1234" },
          method: "post",
        });
        mytoken = res.body.token;

        done();
      })
    );
  });

  it("Can upload file", async () => {
    const res = await uploadFile("molecules.csv", true, mytoken);

    expect(res.status).equals(200);
    expect(res.body).to.haveOwnProperty("message");
    expect(res.body.imported).to.false;
    expect(res.body.errors).to.undefined;
    expect(res.body.warnings).to.not.undefined;
  });
});

function getFile(filename) {
  return fs.readFileSync(`${__dirname}/files/${filename}`);
}

function uploadFile(filename, careAboutWarning, token = "") {
  return new Promise((resolve, reject) => {
    chai
      .request(app)
      .post("/api/v1/import/molecules")
      .set("Authorization", token ? "Bearer " + token : "")
      .set("Content-Type", "text/csv")
      .field("careAboutWarning", careAboutWarning)
      .attach("file", getFile(filename), filename)
      .end(async (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
  });
}
