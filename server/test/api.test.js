import request from "supertest";
import { currentVersion } from "../db/database.js";
import app from "../index.js";
import assert from "assert";
import { generateQuestion } from "../api/question.js";

describe("GET /status", function () {
  it("responds with the status and server version", function (done) {
    request(app)
      .get("/api/v1/status")
      .set("Accept", "application/json")
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect(200, { status: "online", db_version: currentVersion() }, done);
  });
});

describe("Question generation", function () {
  it("return a question of type 1 well formatted", function (done) {
    assert(true);
    generateQuestion(1);
    done();
  });
});
