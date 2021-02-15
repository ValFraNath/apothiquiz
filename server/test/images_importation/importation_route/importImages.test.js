import { throws } from "assert";
import fs from "fs";

import path from "path";

import chai from "chai";
import chaiHttp from "chai-http";
import request from "request";

import { getSortedFiles } from "../../../global/Files.js";
import app from "../../../index.js";
import { forceTruncateTables, getToken, insertData, requestAPI } from "../../index.test.js";

const { expect } = chai;
chai.use(chaiHttp);

const FILES_DIR = path.resolve("test", "images_importation", "importation_route", "files");

describe("Images importation", () => {
  let token;

  before("Get token", (done) => {
    forceTruncateTables("user").then(() =>
      insertData("users.sql").then(() =>
        getToken("fpoguet").then((t) => {
          token = t;
          done();
        })
      )
    );
  });

  it("Can import (not confirmed)", async () => {
    const res = await importImages("default", false, token);
    expect(res.status).equals(202);
    expect(res.body.imported).to.be.false;
    expect(res.body.warnings).to.have.length(0);
  });

  it("Can import (not confirmed with warnings)", async () => {
    const res = await importImages("warnings", false, token);
    expect(res.status).equals(202);
    expect(res.body.imported).to.be.false;
    expect(res.body.warnings).to.have.length(4);
  });

  it("Can import (confirmed)", async () => {
    const res = await importImages("default", "true", token);
    expect(res.status).equals(201);
    expect(res.body.imported).to.be.true;
  });

  it("Can import (confirmed twice)", async () => {
    const res = await importImages("warnings", "true", token);
    expect(res.status).equals(201);
    expect(res.body.imported).to.be.true;
  });

  it("Can get the archive", async (done) => {
    let res = await requestAPI("/import/images", { token, method: "get" });
    expect(res.status).equals(200);
    const { shortpath, url } = res.body;
    console.log(res.body);
    res = await new Promise((resolve) =>
      chai
        .request(app)
        .get(shortpath)
        .set("Authorization", "Barear " + token)
        .end((_, res) => {
          resolve(res);
        })
    );

    expect(res.status).equals(200);
    request({ url, encoding: null }, (err, res, body) => {
      if (err) throw err;
      fs.writeFileSync("zip.zip", body);
      done();
    });
  });
});

/**
 * Send request to import files of a given directory
 * @param {string} dir The directory containing files to send
 * @param {string} confirmed Tell if the importation is confirmed
 * @param {string} token The user token
 */
function importImages(dir, confirmed = "", token = "") {
  return new Promise((resolve, reject) => {
    const req = chai
      .request(app)
      .post("/api/v1/import/images")
      .set("Authorization", token ? "Bearer " + token : "")
      .set("Content-Type", "image/*")
      .field("confirmed", confirmed);

    getSortedFiles(path.resolve(FILES_DIR, dir))
      .then((files) => {
        files.forEach((file) => {
          req.attach("file", fs.readFileSync(path.resolve(FILES_DIR, dir, file)), file);
        });
        req.end((err, res) => {
          if (err) {
            return reject(err);
          }
          resolve(res);
        });
      })
      .catch(reject);
  });
}
