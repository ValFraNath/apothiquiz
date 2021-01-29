import chai from "chai";
import chaiHttp from "chai-http";

import { currentAPIVersion } from "../db/database.js";
import app from "../index.js";

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
          apiVersion: currentAPIVersion(),
        });
        done();
      });
  });
});
