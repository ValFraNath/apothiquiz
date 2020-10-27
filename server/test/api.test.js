import request from "supertest";

import * as db from "../db/database.js";
import app from "../index.js";

before(function waitForAppStarted(done) {
  app.waitReady(done);
});

describe("GET /status", function () {
  it("responds with the status and server version", function (done) {
    request(app)
      .get("/api/v1/status")
      .set("Accept", "application/json")
      .expect("Content-Type", "application/json; charset=utf-8")
      .expect(200, { status: "online", db_version: db.currentVersion() }, done);
  });
});
