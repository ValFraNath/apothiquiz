import request from "supertest";
import app from "../index.js";

describe("GET /", () => {
    it("respond with Hello World", (done) => {
        request(app).get("/").expect('"Hello World !"', done);
    });
});