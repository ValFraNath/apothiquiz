import request from "supertest";
import app from "../index.js";

describe("GET /", function () {
  it("responds with Hello World", function (done) {
    request(app).get("/").expect('"Hello World!"', done);
  });
});
