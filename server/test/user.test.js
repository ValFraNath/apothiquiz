import app from "../index.js";

import chai from "chai";
import chaiHttp from "chai-http";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

chai.use(chaiHttp);
const expect = chai.expect;

describe("User login", function () {
  it("Good user", function (done) {
    chai
      .request(app)
      .post("/api/v1/user/login")
      .send({
        userPseudo: "fpoguet",
        userPassword: "1234",
      })
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status).to.be.equal(200);

        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(Object.keys(res.body)).to.contains("token");

        let decodedToken = jwt.verify(
          res.body.token,
          process.env.TOKEN_PRIVATE_KEY
        );

        expect(Object.keys(decodedToken)).to.contains("pseudo");
        expect(decodedToken.pseudo).to.be.equal("fpoguet");

        done();
      });
  });

  it("User does not exist", function (done) {
    chai
      .request(app)
      .post("/api/v1/user/login")
      .send({
        userPseudo: "noexist",
        userPassword: "1234",
      })
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status).to.be.equal(401);
        done();
      });
  });

  it("Wrong password", function (done) {
    chai
      .request(app)
      .post("/api/v1/user/login")
      .send({
        userPseudo: "vperigno",
        userPassword: "134",
      })
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status).to.be.equal(401);
        done();
      });
  });

  it("Wrong body format", function (done) {
    chai
      .request(app)
      .post("/api/v1/user/login")
      .send({
        pseudo: "vperigno",
        password: "134",
      })
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status).to.be.equal(401);
        done();
      });
  });
});
