import fs from "fs";

import path from "path";

import Zip from "adm-zip";
import chai from "chai";
import chaiHttp from "chai-http";
import equalInAnyOrder from "deep-equal-in-any-order";

import { createDir, deleteFiles, getSortedFiles } from "../../../global/Files.js";
import app from "../../../index.js";
import { forceTruncateTables, getToken, insertData, requestAPI } from "../../index.test.js";

const { expect } = chai;
chai.use(chaiHttp);
chai.use(equalInAnyOrder);

const FILES_DIR = path.resolve("test", "images_importation", "importation_route", "files");
const TMP_DIR = path.resolve("test", "tmp");

describe("Images importation", () => {
  let token;
  const tempFiles = [];

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

  before("Create tmp test directory", (done) => {
    createDir(TMP_DIR).then(() => done());
  });

  after("Delete temporary files", (done) => {
    deleteFiles(...tempFiles.map((f) => path.resolve(TMP_DIR, f))).then(() => done());
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

  it("Can get the archive", async () => {
    let res = await requestAPI("/import/images", { token, method: "get" });
    expect(res.status).equals(200);
    const { shortpath } = res.body;

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

    const archiveName = "images.zip";
    tempFiles.push(archiveName);
    res = await downloadZipArchive(shortpath, token, archiveName);

    const archive = new Zip(path.resolve(TMP_DIR, archiveName));
    const images = archive.getEntries().map((e) => e.entryName);
    expect(images).to.have.length(3);
    expect(images).deep.equalInAnyOrder(["daclatasvir.png", "doravirine.png", "dolutegravir.svg"]);
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

/**
 * Download the images archive and save it in the tmp directory
 * @param {string} shortpath The file path in the server
 * @param {string} token The user token
 * @param {string} output The archive name
 * @returns {Promise<strings>} The archive path
 */
function downloadZipArchive(shortpath, token, output) {
  return new Promise((resolve) =>
    chai
      .request(app)
      .get(shortpath)
      .set("Content-Type", "application/x-www-form-urlencoded")
      .set("Authorization", "Barear " + token)
      .pipe(fs.createWriteStream(path.resolve(TMP_DIR, output)))
      .on("close", () => resolve())
  );
}
