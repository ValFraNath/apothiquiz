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
        expect(res.status, res.error).to.be.equal(200);

        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(Object.keys(res.body)).to.contains("token");

        let decodedToken = jwt.verify(res.body.token, process.env.TOKEN_PRIVATE_KEY);

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

describe("Get user informations", function () {
  var token;
  this.beforeAll(function (done) {
    // Authenticate
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

        expect(res.status, res.error).to.be.equal(200);

        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(Object.keys(res.body)).to.contains("token");
        token = "Bearer " + res.body.token;

        done();
      });
  });

  it("Existing user", function (done) {
    chai
      .request(app)
      .get("/api/v1/user/vperigno")
      .set("Authorization", token)
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, res.error).to.be.equal(200);

        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(res.body.pseudo).to.be.equal("vperigno");
        expect(Object.keys(res.body)).to.contains("losses");
        expect(Object.keys(res.body)).to.contains("wins");
        expect(Object.keys(res.body)).to.contains("avatar");
        done();
      });
  });

  it("User does not exist", function (done) {
    chai
      .request(app)
      .get("/api/v1/user/no-i-do-not-exist")
      .set("Authorization", token)
      .end((err, res) => {
        if (err) {
          throw err;
        }

        expect(res.status).to.be.equal(404);
        done();
      });
  });

  it("Not logged in", function (done) {
    chai
      .request(app)
      .get("/api/v1/user/fpoguet")
      // No Authorization header
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, res.error).to.be.equal(401);
        done();
      });
  });

  it("Get my informations", function (done) {
    chai
      .request(app)
      .get("/api/v1/user/me")
      .set("Authorization", token)
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, res.error).to.be.equal(200);

        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(res.body.pseudo).to.be.equal("fpoguet");
        expect(Object.keys(res.body)).to.contains("losses");
        expect(Object.keys(res.body)).to.contains("wins");
        expect(Object.keys(res.body)).to.contains("avatar");
        done();
      });
  });
});

describe("Update user informations", function () {
  var token;

  this.beforeAll(function (done) {
    // Authenticate
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

        expect(res.status, res.error).to.be.equal(200);

        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(Object.keys(res.body)).to.contains("token");
        token = "Bearer " + res.body.token;

        done();
      });
  });

  it("Update nothing", function (done) {
    chai
      .request(app)
      .patch("/api/v1/user/me")
      .send({ pseudo: "fpoguet" })
      .set("Authorization", token)
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, res.error).to.be.equal(400);
        done();
      });
  });

  it("Update my avatar with /pseudo route", function (done) {
    chai
      .request(app)
      .patch("/api/v1/user/fpoguet")
      .send({ avatar: "newAvatar" })
      .set("Authorization", token)
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, res.error).to.be.equal(200);
        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(res.body.pseudo).to.be.equal("fpoguet");
        expect(Object.keys(res.body)).to.contains("losses");
        expect(Object.keys(res.body)).to.contains("wins");
        expect(Object.keys(res.body)).to.contains("avatar");
        expect(res.body.avatar).to.be.equal("newAvatar");
        done();
      });
  });

  it("Update my avatar with /me route", function (done) {
    chai
      .request(app)
      .patch("/api/v1/user/me")
      .send({ avatar: "evenNewAvatar" })
      .set("Authorization", token)
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, res.error).to.be.equal(200);
        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(res.body.pseudo).to.be.equal("fpoguet");
        expect(Object.keys(res.body)).to.contains("losses");
        expect(Object.keys(res.body)).to.contains("wins");
        expect(Object.keys(res.body)).to.contains("avatar");
        expect(res.body.avatar).to.be.equal("evenNewAvatar");
        done();
      });
  });

  it("Informations has been updated", function (done) {
    chai
      .request(app)
      .get("/api/v1/user/me")
      .set("Authorization", token)
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, res.error).to.be.equal(200);

        expect(Object.keys(res.body)).to.contains("pseudo");
        expect(res.body.pseudo).to.be.equal("fpoguet");
        expect(Object.keys(res.body)).to.contains("losses");
        expect(Object.keys(res.body)).to.contains("wins");
        expect(Object.keys(res.body)).to.contains("avatar");
        expect(res.body.avatar).to.be.equal("evenNewAvatar");
        done();
      });
  });
});
