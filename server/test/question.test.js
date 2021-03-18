import path from "path";

import chai from "chai";
import chaiHttp from "chai-http";

import { queryPromise } from "../db/database.js";

import {
  forceTruncateTables,
  insertData,
  requestAPI,
  importImagesViaAPI,
  getToken,
} from "./index.test.js";

chai.use(chaiHttp);
const { expect } = chai;

describe("Question generation with empty database", () => {
  before("Remove all data", function (done) {
    this.timeout(10000);
    forceTruncateTables(
      "molecule",
      "class",
      "system",
      "property_value",
      "molecule_property",
      "property"
    ).then(() => done());
  });

  for (let type = 1; type <= 10; ++type) {
    it("Question type " + type, async () => {
      const res = await requestAPI("question/" + type);
      expect(res.status).equals(422);
    });
  }
});

describe("Question generation", function () {
  // Only question types we can generate with current data
  const questionTypes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  before("Import data", async function () {
    this.timeout(10000);
    forceTruncateTables(
      "molecule",
      "class",
      "system",
      "property",
      "property_value",
      "molecule_property"
    );
    await insertData("molecules.sql");
  });

  before("Import images", async function () {
    this.timeout(10000);
    await importImagesViaAPI(
      path.resolve("test", "required_data", "images"),
      "true",
      await getToken("fdadeau")
    );
  });

  for (let type of questionTypes) {
    it(`Question of type ${type} well formatted`, async () => {
      const res = await requestAPI("question/" + type);

      expect(res.status, "Status value").to.be.equal(200);
      expect(res.body.type).to.be.equals(type);
      expect(res.body.answers).to.not.contains(null);
      expect(res.body.answers).to.be.deep.equals([...new Set(res.body.answers)]);
      expect(Object.getOwnPropertyNames(res.body)).to.contains("wording");
      expect(res.body.goodAnswer).greaterThan(-1);
      expect(res.body.goodAnswer).lessThan(res.body.answers.length);
      expect(res.body.answers).to.have.length(4);
    });
  }

  it("Type 1 : Consistent values", async () => {
    const res = await requestAPI("question/1");
    const { answers, subject, goodAnswer } = res.body;

    const answersBelongsToClass = await Promise.all(
      answers.map((value) => doesBelongToClass(value, subject))
    );

    answersBelongsToClass.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 2 : Consistent values", async () => {
    const res = await requestAPI("question/2");
    const { answers, subject, goodAnswer } = res.body;

    const answersContainingSubject = await Promise.all(
      answers.map((value) => doesBelongToClass(subject, value))
    );

    answersContainingSubject.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 3 : Consistent value", async () => {
    const res = await requestAPI("question/3");
    const { answers, subject, goodAnswer } = res.body;

    const answersBelongsToSystem = await Promise.all(
      answers.map((value) => doesBelongToSystem(value, subject))
    );

    answersBelongsToSystem.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 4: Consistent values", async () => {
    const res = await requestAPI("question/4");
    const { answers, subject, goodAnswer } = res.body;

    const answersContainingSubject = await Promise.all(
      answers.map((value) => doesBelongToSystem(subject, value))
    );

    answersContainingSubject.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 5: Consistent values", async () => {
    const res = await requestAPI("question/5");
    const { answers, subject, goodAnswer } = res.body;

    const answersHavePropertyValue = await Promise.all(
      answers.map((value) => doesHavePropertyValue(value, "indications", subject))
    );

    answersHavePropertyValue.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 6 : Consistent values", async () => {
    const res = await requestAPI("question/6");
    const { answers, subject, goodAnswer } = res.body;

    const answersHavePropertyValue = await Promise.all(
      answers.map((value) => doesHavePropertyValue(value, "sideEffects", subject))
    );

    answersHavePropertyValue.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 7 : Consistent values", async () => {
    const res = await requestAPI("question/7");
    const { answers, subject, goodAnswer } = res.body;

    const answersHavePropertyValue = await Promise.all(
      answers.map((value) => doesHavePropertyValue(value, "interactions", subject))
    );

    answersHavePropertyValue.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 8 : Consistent values", async () => {
    const res = await requestAPI("question/8");
    const { answers, subject, goodAnswer } = res.body;

    const answersHavePropertyValue = await Promise.all(
      answers.map((value) => doesHavePropertyValue(subject, "indications", value))
    );

    answersHavePropertyValue.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 9 : Consistent values", async () => {
    const res = await requestAPI("question/9");
    const { answers, subject, goodAnswer } = res.body;

    const answersHavePropertyValue = await Promise.all(
      answers.map((value) => doesHavePropertyValue(subject, "sideEffects", value))
    );

    answersHavePropertyValue.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 10: Consistent values", async () => {
    const res = await requestAPI("question/10");
    const { answers, subject, goodAnswer } = res.body;

    const answersHavePropertyValue = await Promise.all(
      answers.map((value) => doesHavePropertyValue(subject, "interactions", value))
    );

    answersHavePropertyValue.forEach((value, index) =>
      expect(value).to.be.equals(index === Number(goodAnswer))
    );
  });

  it("Type 11: Good image url", async () => {
    const {
      body: { subject },
    } = await requestAPI("question/11");

    const res = await requestAPI(subject.split("/api/v1/")[1]);
    expect(res.status).equal(200);
  });

  it("Type 12: Good image url", async () => {
    const {
      body: { answers },
    } = await requestAPI("question/12");

    for (const answer of answers) {
      const res = await requestAPI(answer.split("/api/v1/")[1]);
      expect(res.status).equal(200);
    }
  });

  it("Incorrect question type", async () => {
    const res = await requestAPI("question/-3");
    expect(res.status, "Status value").to.be.equal(404);
  });
});

/**
 * Test if a molecule belongs to a system
 * @param {string} dci The molecule's dci
 * @param {string} systemName The system name
 * @return {Promise<string[]>}
 */
async function doesBelongToSystem(dci, systemName) {
  const res = await queryPromise("CALL getSystemsOf(?)", [dci]);
  return res[0].map((e) => e.sy_name).includes(systemName);
}

/**
 * Test if a molecule belongs to a class
 * @param {string} dci The molecule dci
 * @param {String} className The class name
 * @returns {Promise<boolean>}
 */
async function doesBelongToClass(dci, className) {
  const res = await queryPromise("CALL getClassesOf(?)", [dci]);
  return res[0].map((e) => e.cl_name).includes(className);
}

/**
 * Test if a molecule has a property value
 * @param {string} dci The molecule
 * @param {string} property The property
 * @param {string} value The property value
 * @returns {Promise<boolean>}
 */
async function doesHavePropertyValue(dci, property, value) {
  const res = await queryPromise("CALL getPropertyValuesOf(?,?);", [dci, property]);
  return res[0].map((e) => e.value).includes(value);
}
