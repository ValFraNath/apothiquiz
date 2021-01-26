import chai from "chai";
import chaiHttp from "chai-http";
import mocha from "mocha";
import fs from "fs/promises";
import path from "path";

import { forceTruncateTables, insertData, requestAPI } from "./index.test.js";
import { NUMBER_OF_QUESTIONS_IN_ROUND, NUMBER_OF_ROUNDS_IN_DUEL, _initMockedDuelRounds } from "../controllers/duels.js";
chai.use(chaiHttp);
const { expect } = chai;
const { before } = mocha;

// without data

describe("Duels", () => {
  let tokens;
  before("Clear duels & results", (done) => {
    forceTruncateTables("duel", "results", "user").then(() => insertData("users.sql").then(done));
  });

  before("Mock rounds generation", (done) => {
    fs.readFile(path.resolve("test", "mocks", "rounds.mock.json"), { encoding: "utf8" }).then((mock) => {
      _initMockedDuelRounds(JSON.parse(mock));
      done();
    });
  });

  before("get users tokens", (done) => {
    Promise.all(
      ["vperigno", "nhoun", "fpoguet"].map((user) =>
        requestAPI("user/login", { body: { userPseudo: user, userPassword: "1234" }, method: "post" })
      )
    ).then((res) => {
      tokens = res.reduce((tokens, res) => {
        tokens[res.body.pseudo] = res.body.token;
        return tokens;
      }, Object.create(null));
      done();
    });
  });

  it("Can't create without be logged", async () => {
    const error = await requestAPI("duel/new", {
      method: "post",
      body: { players: ["fpoguet", "nhoun"] },
    });

    expect(error.status).equals(401);
  });

  it("Can't create without players", async () => {
    const error = await requestAPI("duel/new", {
      token: tokens.fpoguet,
      method: "post",
    });

    expect(error.status).equals(400);
  });

  it("Can't create without exactly 2 players", async () => {
    let error = await requestAPI("duel/new", {
      token: tokens.fpoguet,
      method: "post",
      body: { players: ["fpoguet", "nhoun", "vperigno"] },
    });

    expect(error.status).equals(400);

    error = await requestAPI("duel/new", {
      token: tokens.fpoguet,
      method: "post",
      body: { players: ["vperigno"] },
    });

    expect(error.status).equals(400);

    error = await requestAPI("duel/new", {
      token: tokens.fpoguet,
      method: "post",
      body: { players: ["vperigno", "vperigno"] },
    });

    expect(error.status).equals(400);
  });

  it("Can't create with invalid users", async () => {
    const error = await requestAPI("duel/new", {
      token: tokens.fpoguet,
      method: "post",
      body: { players: ["fpoguet", "b"] },
    });

    expect(error.status).equals(404);
  });

  it("Can't create for other users", async () => {
    const error = await requestAPI("duel/new", {
      token: tokens.fpoguet,
      method: "post",
      body: { players: ["nhoun", "vperigno"] },
    });

    expect(error.status).equals(403);
  });

  const ids = [];
  before("Create against nath", async () => {
    ids.push(
      (
        await requestAPI("duel/new", {
          token: tokens.fpoguet,
          method: "post",
          body: { players: ["fpoguet", "nhoun"] },
        })
      ).body.id
    );
  });

  before("Create against val", async () => {
    ids.push(
      (
        await requestAPI("duel/new", {
          token: tokens.fpoguet,
          method: "post",
          body: { players: ["fpoguet", "vperigno"] },
        })
      ).body.id
    );
  });

  it("Different ids", (done) => {
    expect(ids[0]).not.equals(ids[1]);
    done();
  });

  it("Get by creator", async () => {
    const duel = (await requestAPI("duel/" + ids[0], { token: tokens.fpoguet })).body;
    expect(duel.currentRound).equals(1);
    expect(duel.opponent).equals("nhoun");
    expect(duel.rounds).to.have.length(NUMBER_OF_ROUNDS_IN_DUEL);
    duel.rounds.forEach((round) => expect(round).to.have.length(NUMBER_OF_QUESTIONS_IN_ROUND));
  });

  it("Get by opponent", async () => {
    const duel = (await requestAPI("duel/" + ids[0], { token: tokens.nhoun })).body;
    expect(duel.currentRound).equals(1);
    expect(duel.opponent).equals("fpoguet");
    expect(duel.rounds).to.have.length(NUMBER_OF_ROUNDS_IN_DUEL);
    duel.rounds.forEach((round) => expect(round).to.have.length(NUMBER_OF_QUESTIONS_IN_ROUND));
  });

  it("Get by other user", async () => {
    const res = await requestAPI("duel/" + ids[0], { token: tokens.vperigno });
    expect(res.status).to.be.equals(404);
  });

  it("Get all duel : fpoguet", async () => {
    const duels = (await requestAPI("duel/", { token: tokens.fpoguet })).body;
    expect(duels).to.have.length(2);
  });

  it("Get all duel : vperigno", async () => {
    const duels = (await requestAPI("duel/", { token: tokens.vperigno })).body;
    expect(duels).to.have.length(1);
  });

  for (let i = 1; i <= NUMBER_OF_ROUNDS_IN_DUEL; ++i) {
    describe("Play : turn " + i, () => {
      it("Play : fpoguet", async () => {
        let duel = (
          await requestAPI(`duel/${ids[0]}/${i}`, {
            token: tokens.fpoguet,
            method: "post",
            body: { answers: [1, 3, 2, 0, 0] },
          })
        ).body;

        expect(Boolean(duel.inProgress)).to.be.true;
        expect(duel.currentRound).equals(i);

        if (i === 4) {
          expect(duel.userScore).equals(4);
          expect(duel.opponentScore).equals(2);
        }
      });

      it("Play invalid round", async () => {
        const error = await requestAPI(`duel/${ids[0]}/${i + 2}`, {
          token: tokens.fpoguet,
          method: "post",
          body: { answers: [1, 3, 2, 0, 0] },
        });

        expect(error.status).equals(400);
      });

      it("Play invalid player", async () => {
        const error = await requestAPI(`duel/${ids[0]}/${i}`, {
          token: tokens.vperigno,
          method: "post",
          body: { answers: [2, 0, 2, 0, 1] },
        });

        expect(error.status).equals(404);
      });

      it("Play same round twice", async () => {
        const error = await requestAPI(`duel/${ids[0]}/${i}`, {
          token: tokens.fpoguet,
          method: "post",
          body: { answers: [2, 0, 2, 0, 1] },
        });

        expect(error.status).equals(400);
      });
      it("Play : nhoun", async () => {
        const duel = (
          await requestAPI(`duel/${ids[0]}/${i}`, {
            token: tokens.nhoun,
            method: "post",
            body: { answers: [2, 3, 1, 3, 0] },
          })
        ).body;

        if (i !== NUMBER_OF_ROUNDS_IN_DUEL) {
          expect(duel.currentRound).equals(i + 1);
          expect(Boolean(duel.inProgress)).to.be.true;
        }
      });
    });
  }

  describe("Finished duel", () => {
    it("Good results", async () => {
      const duel = (
        await requestAPI(`duel/${ids[0]}`, {
          token: tokens.fpoguet,
          method: "get",
        })
      ).body;

      expect(Boolean(duel.inProgress)).to.be.false;
      expect(duel.userScore).equals(8);
      expect(duel.opponentScore).equals(5);
    });

    it("Users stats updated", async () => {
      const fpoguet = (await requestAPI("user/fpoguet", { token: tokens.fpoguet })).body;
      expect(fpoguet.victories).equals(1);
      expect(fpoguet.defeats).equals(0);

      const nhoun = (await requestAPI("user/nhoun", { token: tokens.nhoun })).body;
      expect(nhoun.victories).equals(0);
      expect(nhoun.defeats).equals(1);
    });

    it("The answers are those expected", async () => {
      const duel = (
        await requestAPI(`duel/${ids[0]}`, {
          token: tokens.nhoun,
          method: "get",
        })
      ).body;

      duel.rounds.forEach((round) => {
        expect(round.map((question) => question.userAnswer)).to.be.deep.equal([2, 3, 1, 3, 0]);
      });

      duel.rounds.forEach((round) => {
        expect(round.map((question) => question.opponentAnswer)).to.be.deep.equal([1, 3, 2, 0, 0]);
      });
    });

    it("Can't play to a finished duel", async () => {
      const duel = await requestAPI(`duel/${ids[0]}/5`, {
        token: tokens.nhoun,
        method: "post",
        body: { answers: [2, 3, 1, 3, 0] },
      });

      expect(duel.status).equals(400);
    });
  });
});
