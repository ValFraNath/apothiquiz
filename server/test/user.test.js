import chai from "chai";
import chaiHttp from "chai-http";
import jwt from "jsonwebtoken";

import app from "../index.js";
import { forceTruncateTables, insertData } from "./index.test.js";

chai.use(chaiHttp);
const expect = chai.expect;
describe("User test", function () {
  before("Insert users data", (done) => {
    forceTruncateTables("user").then(() => insertData("users.sql").then(done));
  });

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
          expect(res.status).to.be.equal(404);
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
    let token;
    before(function (done) {
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
    let token;

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

    it("Update bad avatar (not object)", function (done) {
      chai
        .request(app)
        .patch("/api/v1/user/fpoguet")
        .send({ avatar: "this-is-not-an-avatar" })
        .set("Authorization", token)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(400);

          done();
        });
    });

    it("Update bad avatar (missing field)", function (done) {
      chai
        .request(app)
        .patch("/api/v1/user/fpoguet")
        .send({ avatar: { colorBG: "#ffffff", colorBody: "#dedede", eyes: 0, hands: 0, hat: 0 } }) // missing an information
        .set("Authorization", token)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(400);

          done();
        });
    });

    it("Update bad avatar (integer is not an integer)", function (done) {
      chai
        .request(app)
        .patch("/api/v1/user/fpoguet")
        .send({
          avatar: { colorBG: "#ffffff", colorBody: "#dedede", eyes: 0, hands: 0, hat: 0, mouth: "this-is-not-an-int" },
        }) // missing an information
        .set("Authorization", token)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(400);

          done();
        });
    });

    it("Update bad avatar (integer is not an integer but a string with an integer inside)", function (done) {
      chai
        .request(app)
        .patch("/api/v1/user/fpoguet")
        .send({
          avatar: { colorBG: "#ffffff", colorBody: "#dedede", eyes: 0, hands: 0, hat: 0, mouth: "0" },
        }) // missing an information
        .set("Authorization", token)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(400);

          done();
        });
    });

    it("Update bad avatar (color is not a color)", function (done) {
      chai
        .request(app)
        .patch("/api/v1/user/fpoguet")
        .send({
          avatar: { colorBG: "#ffffff", colorBody: "#camion", eyes: 0, hands: 0, hat: 0, mouth: 0 },
        }) // missing an information
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
        .send({ avatar: { colorBG: "#ffffff", colorBody: "#dedede", eyes: 0, hands: 0, hat: 0, mouth: 0 } })
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
          expect(res.body.avatar).to.be.deep.equal({
            colorBG: "#ffffff",
            colorBody: "#dedede",
            eyes: 0,
            hands: 0,
            hat: 0,
            mouth: 0,
          });
          done();
        });
    });

    it("Update my avatar with /me route", function (done) {
      chai
        .request(app)
        .patch("/api/v1/user/me")
        .send({ avatar: { colorBG: "#158233", colorBody: "#9F7F53", eyes: 0, hands: 0, hat: 0, mouth: 0 } })
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
          expect(res.body.avatar).to.be.deep.equal({
            colorBG: "#158233",
            colorBody: "#9F7F53",
            eyes: 0,
            hands: 0,
            hat: 0,
            mouth: 0,
          });
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
          expect(res.body.avatar).to.be.deep.equal({
            colorBG: "#158233",
            colorBody: "#9F7F53",
            eyes: 0,
            hands: 0,
            hat: 0,
            mouth: 0,
          });
          done();
        });
    });
  });
});
