import path from "path";

import chai from "chai";

import { forceTruncateTables, getToken, insertData, requestAPI } from "../index.test.js";
import { uploadFile } from "../importation-test/molecules-importation/importation_route/importMolecule.test.js";

const { expect } = chai;

const FILES_DIR = path.resolve("test", "config", "files");

describe("Configuration tests", () => {
  before("Clear & insert data", async function () {
    this.timeout(10000);
    await forceTruncateTables(
      "molecule",
      "class",
      "system",
      "property",
      "property_value",
      "molecule_property",
      "user",
      "duel",
      "results"
    );
    await insertData("molecules.sql");
    await insertData("users.sql");
  });

  let token;
  before("Get token", async () => {
    token = await getToken("fdadeau", "1234");
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

  it("Can't fetch & update config without being admin", async () => {
    const noAdminToken = await getToken("fpoguet");
    let res = await requestAPI("config", { token: noAdminToken, method: "get" });
    expect(res.status).equal(403);

    res = await requestAPI("config", {
      body: {
        roundsPerDuel: 8,
        questionTimerDuration: 4,
        questionsPerRound: 10,
      },
      token: noAdminToken,
      method: "patch",
    });

    expect(res.status).equal(403);
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
  }).timeout(10000);

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
  }).timeout(5000);

  it("Config value decreased after a new smaller import", async () => {
    await requestAPI("config", {
      body: { roundsPerDuel: 8 },
      token,
      method: "patch",
    });

    await uploadFile("molecules_little_sample.csv", true, token, FILES_DIR);

    const res = await requestAPI("config", { token, method: "get" });
    expect(res.body.roundsPerDuel.value).equal(6);
    expect(res.body.roundsPerDuel.max).equal(6);
  });

  it("Value to 0 after empty import", async () => {
    await uploadFile("molecules_empty.csv", true, token, FILES_DIR);

    const res = await requestAPI("config", { token, method: "get" });
    expect(res.body.roundsPerDuel.value).equal(0);
    expect(res.body.roundsPerDuel.max).equal(0);
  });

  it("Value set to default after new import when the value is 0 (max > 5)", async () => {
    await uploadFile("molecules_little_sample.csv", true, token, FILES_DIR);

    const res = await requestAPI("config", { token, method: "get" });
    expect(res.body.roundsPerDuel.value).equal(5);
    expect(res.body.roundsPerDuel.max).equal(6);
  });

  it("Value set to default after new import when the value is 0 (max < 5)", async () => {
    await uploadFile("molecules_no_properties.csv", true, token, FILES_DIR);

    const res = await requestAPI("config", { token, method: "get" });
    expect(res.body.roundsPerDuel.value).equal(3);
    expect(res.body.roundsPerDuel.max).equal(3);
  });
});
