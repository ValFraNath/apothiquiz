import request from "supertest";
import { currentVersion } from "../db/database.js";
import app from "../index.js";

import chai from "chai";
import chaiHttp from "chai-http";

chai.use(chaiHttp);
const expect = chai.expect;

describe("GET /status", function () {
  it("responds with the status and server version", function (done) {
    request(app)
      .get("/api/v1/status")
      .expect(200, { status: "online", db_version: currentVersion() }, done);
  });
});

describe("Question generation", function () {
  it("return a question of type 1 well formatted", function (done) {
    chai
      .request(app)
      .get("/api/v1/question/1")
      .end((err, res) => {
        expect(res.status, "Status value").to.be.equal(200);
        expect(
          Object.getOwnPropertyNames(res.body),
          "Have property 'question' "
        ).to.contains("question");
        done();
      });
  });

  it("Incorrect question type", function (done) {
    chai
      .request(app)
      .get("/api/v1/question/-3")
      .end((err, res) => {
        expect(res.status, "Status value").to.be.equal(404);
        done();
      });
  });
});
