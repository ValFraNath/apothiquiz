import fs from "fs";
import path from "path";

import chai from "chai";
import chaiHttp from "chai-http";

import { queryPromise } from "../../../db/database.js";
import app from "../../../index.js";
import { forceTruncateTables, getToken, insertData, requestAPI } from "../../index.test.js";

const { expect } = chai;

chai.use(chaiHttp);

const __dirname = path.resolve("test", "users_importation", "importation_route");

// TODO test import with non admin user
describe("Import users", () => {
  let mytoken;
  before("Insert users data & get token", async function () {
    this.timeout(10000);
    await forceTruncateTables("user");
    await insertData("users.sql");

    mytoken = await getToken("fdadeau");
  });

  it("Can upload file", async () => {
    const res = await uploadFile("users.csv", "false", mytoken);
    expect(res.status).equals(202);
    expect(res.body).to.haveOwnProperty("message");
    expect(res.body.imported).to.false;
    expect(res.body.errors).to.undefined;
    expect(res.body.warnings).to.not.undefined;
    res.body.warnings.forEach((warning) => expect(warning).to.haveOwnProperty("message"));
  });

  it("Upload files and get the last", async () => {
    let res = await uploadFile("users.csv", "true", mytoken);
    expect(res.status).equals(201);
    expect(res.body.imported).to.be.true;

    res = await uploadFile("small.csv", "true", mytoken);
    expect(res.status).equals(201);
    expect(res.body.imported).to.be.true;
    const size = getFileSize("small.csv");

    let countUsers = await queryPromise(
      "SELECT COUNT(*) as count FROM user WHERE us_deleted IS NULL"
    );
    expect(countUsers[0].count).equals(5);

    res = await requestAPI("import/users", { method: "get", token: mytoken });

    res = await new Promise((resolve) =>
      chai
        .request(app)
        .get(res.body.shortpath)
        .set("Authorization", "Barear " + mytoken)
        .end((_, res) => {
          resolve(res);
        })
    );

    expect(res.status).equals(200);
    expect(Number(res.headers["content-length"])).to.be.equals(size);
  });

  it("Import bad files", async () => {
    let res = await uploadFile("bad.csv", false, mytoken);

    expect(res.status).equals(422);

    expect(res.body.errors).to.have.length.greaterThan(0);
    expect(res.body.imported).to.be.false;

    res = await uploadFile("bad.csv", true, mytoken);

    expect(res.status).equals(422);

    expect(res.body.errors).to.have.length.greaterThan(0);
    res.body.errors.forEach((error) => expect(error).to.haveOwnProperty("message"));
    expect(res.body.imported).to.be.false;
  });

  it("Can't access file without being logged", async () => {
    await uploadFile("users.csv", "true", mytoken);
    let res = await requestAPI("import/users", { method: "get", token: mytoken });

    res = await new Promise((resolve) =>
      chai
        .request(app)
        .get(res.body.shortpath)
        .end((_, res) => {
          resolve(res);
        })
    );

    expect(res.status).equals(401);
  });

  it("Missing file", async () => {
    let res = await new Promise((resolve, reject) => {
      chai
        .request(app)
        .post("/api/v1/import/users")
        .set("Authorization", "Bearer " + mytoken)
        .set("Content-Type", "text/csv")
        .field("confirmed", "true")
        .end(async (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve(res);
        });
    });
    expect(res.status).equals(400);
  });

  it("Bad format file", async () => {
    const res = await uploadFile("users.xlsx", true, mytoken);
    expect(res.status).equals(400);
  });
});

/**
 * Make a request with a file
 * @param {string} filename The file name
 * @param {string} confirmed Tell if the request is confirmed
 * @param {string} token The token
 * @returns {Promise}
 */
export function uploadFile(
  filename,
  confirmed,
  token = "",
  dir = path.resolve(__dirname, "files")
) {
  return new Promise((resolve, reject) => {
    chai
      .request(app)
      .post("/api/v1/import/users")
      .set("Authorization", token ? "Bearer " + token : "")
      .set("Content-Type", "text/csv")
      .field("confirmed", confirmed)
      .attach("file", fs.readFileSync(path.resolve(dir, filename)), filename)
      .end(async (err, res) => {
        if (err) {
          return reject(err);
        }
        resolve(res);
      });
  });
}

/**
 * Get a file size
 * @param {string} filename The filename
 * @returns {number} The size
 */
function getFileSize(filename) {
  return fs.statSync(`${__dirname}/files/${filename}`).size;
}
