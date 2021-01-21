import chai from "chai";
import chaiHttp from "chai-http";

import app from "../index.js";
import { queryPromise } from "../db/database.js";
import { forceTruncateTables, insertData } from "./index.test.js";

chai.use(chaiHttp);
const { expect } = chai;

const questionTypes = ["A ", " A", "   a    "];

describe("Question generation", function () {
  before("Import data", (done) => {
    forceTruncateTables("molecule", "class", "system", "property", "property_value", "molecule_property").then(() =>
      insertData("molecules.sql").then(done)
    );
  });

  for (let type of questionTypes) {
    it(`Question of type ${type} well formatted`, function (done) {
      chai
        .request(app)
        .get("/api/v1/question/" + type)
        .end((err, res) => {
          if (err) {
            throw err;
          }

          expect(res.status, "Status value").to.be.equal(200);
          expect(Object.getOwnPropertyNames(res.body), "Have property 'question' ").to.contains("subject");
          done();
        });
    });
  }

  it("Type A : Consistent values", (done) => {
    chai
      .request(app)
      .get("/api/v1/question/A")
      .end((err, res) => {
        if (err) {
          throw err;
        }
        const { answers, subject, goodAnswer } = res.body;

        const answersBelongsToClass = answers.map((value) => doesBelongToClass(value, subject));
        Promise.all(answersBelongsToClass).then((res) => {
          res.forEach((value, index) => expect(value).equals(index === Number(goodAnswer)));
          done();
        });
      });
  });

  it("Incorrect question type", function (done) {
    chai
      .request(app)
      .get("/api/v1/question/-3")
      .end((err, res) => {
        if (err) {
          throw err;
        }
        expect(res.status, "Status value").to.be.equal(404);
        done();
      });
  });
});

/**
 * get the classes to which a given molecule belongs
 * @param {string} dci The molecule's dci
 * @return {string[]}
 */
function getClassesOf(dci) {
  return new Promise((resolve, reject) => {
    queryPromise("CALL getClassesOf(?)", [dci])
      .then((res) => {
        resolve(res[0].map((e) => e.cl_name));
      })
      .catch(reject);
  });
}

/**
 * Test if a molecule belongs to a class
 * @param {string} dci The molecule dci
 * @param {String} className The class name
 * @returns {boolean}
 */
function doesBelongToClass(dci, className) {
  return new Promise((resolve) => {
    getClassesOf(dci).then((classes) => resolve(classes.includes(className)));
  });
}
