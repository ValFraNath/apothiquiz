import request from "supertest";
import app from "../index.js";

before(function (done) {
  app.on("app_started", done);
});

describe("GET /", function () {
  it("responds with Hello World", function (done) {
    request(app).get("/api/v1/status").expect('"Hello World!"', done);
  });
});
