import chai from "chai";

import { forceTruncateTables, getToken, insertData, requestAPI } from "./index.test.js";

const { expect } = chai;

describe("Configuration tests", () => {
  before("Clear & insert data", (done) => {
    console.log(Date.now());
    forceTruncateTables(
      "molecule",
      "class",
      "system",
      "property",
      "property_value",
      "molecule_property",
      "user",
      "duel",
      "results"
    ).then(() =>
      insertData("molecules.sql").then(() =>
        insertData("users.sql").then(() => {
          console.log(Date.now());
          done();
        })
      )
    );
  });

  let token;
  before("Get token", (done) => {
    getToken("fpoguet", "1234").then((t) => {
      token = t;
      done();
    });
  });

  it("Can fetch configuration with default values", async () => {
    const res = await requestAPI("config", { token, method: "get" });
    expect(res.status).equal(200);

    const keys = ["questionsPerRound", "questionTimerDuration", "roundsPerDuel"];

    keys.forEach((key) => {
      expect(res.body).haveOwnProperty(key);
      expect(res.body[key]).haveOwnProperty("max");
      expect(res.body[key]).haveOwnProperty("min");
      expect(res.body[key]).haveOwnProperty("value");
    });
  });

  it("Can update configuration", async () => {
    let res = await requestAPI("config", {
      body: {
        roundsPerDuel: 8,
        questionTimerDuration: 4,
        questionsPerRound: 10,
      },
      token,
      method: "patch",
    });

    expect(res.status).equal(200);
    expect(res.body.roundsPerDuel.value).to.be.equal(8);
    expect(res.body.questionTimerDuration.value).to.be.equal(4);

    const res2 = await requestAPI("config", { token, method: "get" });
    expect(res.body).to.be.deep.equal(res2.body);
  });

  it("Duels created in accordance with the configuration", async () => {
    let res = await requestAPI("duels/new", {
      token,
      method: "post",
      body: { opponent: "vperigno" },
    });

    expect(res.status).equal(201);
    const { id } = res.body;

    res = await requestAPI("duels/" + id, { token });

    expect(res.status).equal(200);
    expect(res.body.rounds).to.have.length(8);
    res.body.rounds.forEach((round) => expect(round).to.have.length(10));
    expect(res.body.questionTimerDuration).equals(4);
  });

  it("Timer duration sent with questions", async () => {
    const res = await requestAPI("question/7");
    expect(res.status).equal(200);
    expect(res.body.timerDuration).equal(4);
  });

  it("Can't update with invalid data", async () => {
    let res = await requestAPI("config", { token, method: "get" });
    const configBeforeUpdate = res.body;

    res = await requestAPI("config", {
      body: {
        roundsPerDuel: configBeforeUpdate.roundsPerDuel.max + 1,
        questionTimerDuration: 4,
        questionsPerRound: 10,
      },
      token,
      method: "patch",
    });

    expect(res.status).equal(400);

    res = await requestAPI("config", {
      body: {
        questionTimerDuration: 4,
        questionsPerRound: -1,
      },
      token,
      method: "patch",
    });

    expect(res.status).equal(400);

    res = await requestAPI("config", { token, method: "get" });
    expect(res.body).deep.equal(configBeforeUpdate);
  });
});