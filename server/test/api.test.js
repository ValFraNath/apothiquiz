import db from "../db/database.js";
import app from "../index.js";

import chai from "chai";
import chaiHttp from "chai-http";
chai.use(chaiHttp);
const expect = chai.expect;

describe("GET /status", function () {
  it("responds with the status and server version", function (done) {
    chai
      .request(app)
      .get("/api/v1/status")
      .end((err, res) => {
        expect(res.status).to.be.equal(200);
        expect(res.body).to.be.deep.equal({
          status: "connected",
          api_version: db.currentAPIVersion(),
        });
        done();
      });
  });
});

describe.skip("Question generation", function () {
  it("return a question of type 1 well formatted", function (done) {
    chai
      .request(app)
      .get("/api/v1/question/1")
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, "Status value").to.be.equal(200);
        expect(Object.getOwnPropertyNames(res.body), "Have property 'question' ").to.contains("question");
        done();
      });
  });

  it("Incorrect question type", function (done) {
    chai
      .request(app)
      .get("/api/v1/question/-3")
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, "Status value").to.be.equal(404);
        done();
      });
  });
});
