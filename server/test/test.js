import request from "supertest";
import app from "../index.js";

describe("GET /", function () {
  it("responds with Hello World", function (done) {
    request(app).get("/api/v1/status").expect('"Hello World!"', done);
  });
});
