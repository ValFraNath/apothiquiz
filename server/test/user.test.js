import chai from "chai";
import chaiHttp from "chai-http";
import jwt from "jsonwebtoken";
import sinon from "sinon";

import { queryPromise } from "../db/database.js";

import app from "../index.js";

import { forceTruncateTables, insertData, requestAPI } from "./index.test.js";

chai.use(chaiHttp);
const { expect } = chai;
describe("User test", function () {
  function decodeRefreshToken(refreshToken) {
    const { APOTHIQUIZ_REFRESH_TOKEN_KEY } = process.env;
    const { user, isAdmin } = jwt.verify(refreshToken, APOTHIQUIZ_REFRESH_TOKEN_KEY);
    return { user, isAdmin };
  }

  function decodeAccessToken(accessToken) {
    const { APOTHIQUIZ_ACCESS_TOKEN_KEY } = process.env;
    const { user, isAdmin } = jwt.verify(accessToken, APOTHIQUIZ_ACCESS_TOKEN_KEY);
    return { user, isAdmin };
  }

  before("Insert users data", async function () {
    this.timeout(10000);
    await forceTruncateTables("user");
    await insertData("users.sql");
  });

  describe("User login", function () {
    it("Good user", async function () {
      const res = await requestAPI("users/login", {
        body: {
          userPseudo: "fpoguet",
          userPassword: "1234",
        },
        method: "post",
      });

      expect(res.status, res.error).to.be.equal(200);
      expect(res.body).to.haveOwnProperty("user");
      expect(res.body).to.haveOwnProperty("accessToken");
      expect(res.body).to.haveOwnProperty("refreshToken");

      expect(res.body.user).equal("fpoguet");
      expect(res.body.isAdmin).false;

      expect(decodeRefreshToken(res.body.refreshToken)).deep.equal({
        user: "fpoguet",
        isAdmin: false,
      });

      expect(decodeAccessToken(res.body.accessToken)).deep.equal({
        user: "fpoguet",
        isAdmin: false,
      });
    });

    it("Admin user", async () => {
      const res = await requestAPI("users/login", {
        body: {
          userPseudo: "fdadeau",
          userPassword: "1234",
        },
        method: "post",
      });

      expect(res.body.isAdmin).true;

      expect(decodeRefreshToken(res.body.refreshToken)).deep.equal({
        user: "fdadeau",
        isAdmin: true,
      });

      expect(decodeAccessToken(res.body.accessToken)).deep.equal({
        user: "fdadeau",
        isAdmin: true,
      });
    });

    it("User does not exist", async function () {
      const res = await requestAPI("users/login", {
        body: {
          userPseudo: "noexist",
          userPassword: "1234",
        },
        method: "post",
      });
      expect(res.status).to.be.equal(404);
    });

    it("Wrong password", async function () {
      const res = await requestAPI("users/login", {
        body: {
          userPseudo: "vperigno",
          userPassword: "134",
        },
        method: "post",
      });
      expect(res.status).to.be.equal(401);
    });

    it("Wrong body format", async function () {
      const res = await requestAPI("users/login", {
        body: {
          pseudo: "noexist",
          password: "1234",
        },
        method: "post",
      });
      expect(res.status).to.be.equal(400);
    });
  });

  describe("Use refresh and access tokens", async function () {
    const tokens = {};
    before("Get tokens", async function () {
      const {
        body: { accessToken, refreshToken },
      } = await requestAPI("users/login", {
        body: { userPseudo: "fpoguet", userPassword: "1234" },
        method: "post",
      });

      expect(refreshToken).not.undefined;
      expect(accessToken).not.undefined;

      tokens.refresh = refreshToken;
      tokens.access = accessToken;
    });

    it("Can generate access token", async () => {
      const res = await requestAPI("users/token", {
        body: { refreshToken: tokens.refresh },
        method: "post",
      });

      expect(res.status).equal(200);
      expect(res.body).haveOwnProperty("accessToken");

      expect(decodeAccessToken(res.body.accessToken)).deep.equal({
        user: "fpoguet",
        isAdmin: false,
      });
    });

    it("Can logout", async () => {
      const res = await requestAPI("users/logout", {
        body: { refreshToken: tokens.refresh },
        method: "post",
        token: tokens.access,
      });

      expect(res.status).equal(200);
    });

    it("Can't generate new access token after logout", async () => {
      const res = await requestAPI("users/token", {
        body: { refreshToken: tokens.refresh },
        method: "post",
      });

      expect(res.status).equal(400);
    });

    it("Can't use an expired access token", async () => {
      const clock = sinon.useFakeTimers(Date.now() + 1000 * 60 * 11);

      const res = await requestAPI("users", { token: tokens.access });
      expect(res.status).equal(401);

      clock.restore();
    });
  });

  describe("Get all users data", async function () {
    let token;
    before(async function () {
      // Authenticate
      const res = await requestAPI("users/login", {
        body: {
          userPseudo: "fpoguet",
          userPassword: "1234",
        },
        method: "post",
      });
      expect(res.status).to.be.equal(200);
      expect(Object.keys(res.body)).to.contains("user");
      expect(Object.keys(res.body)).to.contains("accessToken");
      // eslint-disable-next-line prefer-destructuring
      token = res.body.accessToken;
    });

    before("Remove existing duels", async () => {
      await forceTruncateTables("duel", "results");
    });

    before("Create some duels, including a finished one", async () => {
      const fakeQuestions = [
        [
          {
            subject: "nifédipine",
            goodAnswer: 3,
            answers: ["urologie", "Douleurs-inflammation", "hémostase", "Cardio-vasculaire"],
            type: 4,
            wording: "À quel système la molécule « nifédipine » appartient-elle ?",
            title: "1 molecule - 4 systèmes",
          },
          {
            subject: "DOLUTEGRAVIR",
            goodAnswer: 1,
            answers: ["thrombose veineuse profonde", "VIH", "VZV", "asthme/BPCO"],
            type: 8,
            wording: "Quelle indication la molécule « DOLUTEGRAVIR » a-t-elle ?",
            title: "1 molécule - 4 indications",
          },
        ],
        [
          {
            subject: "CLARITHROMYCINE",
            goodAnswer: 0,
            answers: ["CYP3A4", "Allongement QT", "substrat CYP452", "substrat à risque du CYP452"],
            type: 10,
            wording: "Quelle interaction la molécule « CLARITHROMYCINE » a-t-elle ?",
            title: "1 molécule - 4 interactions",
          },
          {
            subject: "cancers",
            goodAnswer: 2,
            answers: ["ROXITHROMYCINE", "argatroban", "temsirolimus", "bosentan"],
            type: 5,
            wording: "Quelle molécule a comme indication « cancers » ?",
            title: "1 indication - 4 molecules",
          },
        ],
      ];

      const duelID = 9999;

      const sql = `
        INSERT INTO duel(du_id,du_content,du_currentRound,du_inProgress,du_questionTimerDuration,du_finished)
        VALUES (
          ${duelID},
          '${JSON.stringify(fakeQuestions)}',
          ${fakeQuestions.length},
          ${false},
          10,
          '2021-03-29 15:11:29'
        );
        INSERT INTO 
          results (us_login,  du_id,      re_answers,     re_last_time)
        VALUES    ('fpoguet', ${duelID}, '[[0,0],[0,0]]', '2021-03-29 15:11:29'),
                  ('fdadeau', ${duelID}, '[[0,1],[2,3]]', '2021-03-29 15:11:25')
      `;

      await Promise.all([
        requestAPI("duels/new", {
          token: token,
          method: "post",
          body: { opponent: "nhoun" },
        }),
        requestAPI("duels/new", {
          token: token,
          method: "post",
          body: { opponent: "vperigno" },
        }),
        queryPromise(sql),
      ]);
    });

    it("Get all users", async function () {
      const res = await requestAPI("users", {
        token: token,
        method: "get",
      });

      expect(res.status, res.error).to.be.equal(200);

      expect(Object.keys(res.body)).to.have.lengthOf(5);
      expect(Object.keys(res.body)).to.contains("nhoun");
      expect(Object.keys(res.body)).to.contains("fpoguet");
      expect(Object.keys(res.body)).to.contains("vperigno");
      expect(Object.keys(res.body)).to.contains("fdadeau");
      expect(Object.keys(res.body)).to.contains("test");

      const firstUser = res.body["nhoun"];
      expect(Object.keys(firstUser)).to.contains("pseudo");
      expect(firstUser.pseudo).to.be.equal("nhoun");
      expect(Object.keys(firstUser)).to.contains("defeats");
      expect(Object.keys(firstUser)).to.contains("victories");
      expect(Object.keys(firstUser)).to.contains("avatar");
    });

    it("Get all challengeable users", async function () {
      const res = await requestAPI("users?challengeable=true", {
        token: token,
        method: "get",
      });

      expect(res.status, res.error).to.be.equal(200);
      expect(Object.keys(res.body)).to.have.lengthOf(2);
      expect(Object.keys(res.body)).to.contains("fdadeau");
      expect(Object.keys(res.body)).to.contains("test");

      const firstUser = res.body["test"];
      expect(Object.keys(firstUser)).to.contains("pseudo");
      expect(firstUser.pseudo).to.be.equal("test");
      expect(Object.keys(firstUser)).to.contains("defeats");
      expect(Object.keys(firstUser)).to.contains("victories");
      expect(Object.keys(firstUser)).to.contains("avatar");
    });
  });

  describe("Get data from several users", function () {
    let token;
    before(async function () {
      // Authenticate
      const res = await requestAPI("users/login", {
        body: {
          userPseudo: "fpoguet",
          userPassword: "1234",
        },
        method: "post",
      });
      expect(res.status).to.be.equal(200);
      expect(Object.keys(res.body)).to.contains("user");
      expect(Object.keys(res.body)).to.contains("accessToken");
      // eslint-disable-next-line prefer-destructuring
      token = res.body.accessToken;
    });

    it("All users exist", async function () {
      const res = await requestAPI("users", {
        token: token,
        body: ["nhoun", "fpoguet"],
        method: "post",
      });

      expect(res.status, res.error).to.be.equal(200);

      expect(Object.keys(res.body)).to.have.lengthOf(2);
      expect(Object.keys(res.body)).to.contains("nhoun");
      expect(Object.keys(res.body)).to.contains("fpoguet");

      const firstUser = res.body["nhoun"];
      expect(Object.keys(firstUser)).to.contains("pseudo");
      expect(firstUser.pseudo).to.be.equal("nhoun");
      expect(Object.keys(firstUser)).to.contains("defeats");
      expect(Object.keys(firstUser)).to.contains("victories");
      expect(Object.keys(firstUser)).to.contains("avatar");
    });

    it("Some users do not exist", async function () {
      const res = await requestAPI("users", {
        token: token,
        body: ["nhoun", "azerty"],
        method: "post",
      });

      expect(res.status, res.error).to.be.equal(200);

      expect(Object.keys(res.body)).to.have.lengthOf(1);
      expect(Object.keys(res.body)).to.contains("nhoun");

      const firstUser = res.body["nhoun"];
      expect(Object.keys(firstUser)).to.contains("pseudo");
      expect(firstUser.pseudo).to.be.equal("nhoun");
      expect(Object.keys(firstUser)).to.contains("defeats");
      expect(Object.keys(firstUser)).to.contains("victories");
      expect(Object.keys(firstUser)).to.contains("avatar");
    });

    it("Not logged in", async function () {
      const err = await requestAPI("users", {
        body: ["nhoun", "fpoguet"],
        method: "post",
      });
      expect(err.status).to.be.equal(401);
    });
  });

  describe("Get user informations", function () {
    let authHeader;
    before(function (done) {
      // Authenticate
      chai
        .request(app)
        .post("/api/v1/users/login")
        .send({
          userPseudo: "fpoguet",
          userPassword: "1234",
        })
        .end((err, res) => {
          if (err) {
            throw err;
          }

          expect(res.status, res.error).to.be.equal(200);

          expect(res.body).to.haveOwnProperty("user");
          expect(res.body).to.haveOwnProperty("accessToken");
          authHeader = `Bearer ${res.body.accessToken}`;

          done();
        });
    });

    it("Existing user", function (done) {
      chai
        .request(app)
        .get("/api/v1/users/vperigno")
        .set("Authorization", authHeader)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(200);

          expect(Object.keys(res.body)).to.contains("pseudo");
          expect(res.body.pseudo).to.be.equal("vperigno");
          expect(Object.keys(res.body)).to.contains("defeats");
          expect(Object.keys(res.body)).to.contains("victories");
          expect(Object.keys(res.body)).to.contains("avatar");
          done();
        });
    });

    it("User does not exist", function (done) {
      chai
        .request(app)
        .get("/api/v1/users/no-i-do-not-exist")
        .set("Authorization", authHeader)
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
        .get("/api/v1/users/fpoguet")
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
        .get("/api/v1/users/me")
        .set("Authorization", authHeader)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(200);

          expect(Object.keys(res.body)).to.contains("pseudo");
          expect(res.body.pseudo).to.be.equal("fpoguet");
          expect(Object.keys(res.body)).to.contains("defeats");
          expect(Object.keys(res.body)).to.contains("victories");
          expect(Object.keys(res.body)).to.contains("avatar");
          done();
        });
    });
  });

  describe("Update user informations", function () {
    let authHeader;

    this.beforeAll(function (done) {
      // Authenticate
      chai
        .request(app)
        .post("/api/v1/users/login")
        .send({
          userPseudo: "fpoguet",
          userPassword: "1234",
        })
        .end((err, res) => {
          if (err) {
            throw err;
          }

          expect(res.status, res.error).to.be.equal(200);

          expect(res.body).to.haveOwnProperty("user");
          expect(res.body).to.haveOwnProperty("accessToken");
          authHeader = `Bearer ${res.body.accessToken}`;

          done();
        });
    });

    it("Update nothing", function (done) {
      chai
        .request(app)
        .patch("/api/v1/users/me")
        .send({ pseudo: "fpoguet" })
        .set("Authorization", authHeader)
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
        .patch("/api/v1/users/fpoguet")
        .send({ avatar: "this-is-not-an-avatar" })
        .set("Authorization", authHeader)
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
        .patch("/api/v1/users/fpoguet")
        .send({ avatar: { colorBG: "#ffffff", colorBody: "#dedede", eyes: 0, hands: 0, hat: 0 } }) // missing an information
        .set("Authorization", authHeader)
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
        .patch("/api/v1/users/fpoguet")
        .send({
          avatar: {
            colorBG: "#ffffff",
            colorBody: "#dedede",
            eyes: 0,
            hands: 0,
            hat: 0,
            mouth: "this-is-not-an-int",
          },
        }) // missing an information
        .set("Authorization", authHeader)
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
        .patch("/api/v1/users/fpoguet")
        .send({
          avatar: {
            colorBG: "#ffffff",
            colorBody: "#dedede",
            eyes: 0,
            hands: 0,
            hat: 0,
            mouth: "0",
          },
        }) // missing an information
        .set("Authorization", authHeader)
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
        .patch("/api/v1/users/fpoguet")
        .send({
          avatar: { colorBG: "#ffffff", colorBody: "#camion", eyes: 0, hands: 0, hat: 0, mouth: 0 },
        }) // missing an information
        .set("Authorization", authHeader)
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
        .patch("/api/v1/users/fpoguet")
        .send({
          avatar: { colorBG: "#ffffff", colorBody: "#dedede", eyes: 0, hands: 0, hat: 0, mouth: 0 },
        })
        .set("Authorization", authHeader)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(200);
          expect(Object.keys(res.body)).to.contains("pseudo");
          expect(res.body.pseudo).to.be.equal("fpoguet");
          expect(Object.keys(res.body)).to.contains("defeats");
          expect(Object.keys(res.body)).to.contains("victories");
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
        .patch("/api/v1/users/me")
        .send({
          avatar: { colorBG: "#158233", colorBody: "#9F7F53", eyes: 0, hands: 0, hat: 0, mouth: 0 },
        })
        .set("Authorization", authHeader)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(200);
          expect(Object.keys(res.body)).to.contains("pseudo");
          expect(res.body.pseudo).to.be.equal("fpoguet");
          expect(Object.keys(res.body)).to.contains("defeats");
          expect(Object.keys(res.body)).to.contains("victories");
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
        .get("/api/v1/users/me")
        .set("Authorization", authHeader)
        .end((err, res) => {
          if (err) {
            throw err;
          }
          expect(res.status, res.error).to.be.equal(200);

          expect(Object.keys(res.body)).to.contains("pseudo");
          expect(res.body.pseudo).to.be.equal("fpoguet");
          expect(Object.keys(res.body)).to.contains("defeats");
          expect(Object.keys(res.body)).to.contains("victories");
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
