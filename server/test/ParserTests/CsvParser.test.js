import path from "path";
import chai from "chai";
import chaiHttp from "chai-http";
import mocha from "mocha";
const { before } = mocha;
import fs from "fs";

chai.use(chaiHttp);
const { expect } = chai;

import { parseCSV } from "../../modules/CSVParser/Parser.js";
import { expectations } from "./expectations.js";

// eslint-disable-next-line no-unused-vars
import { ClassificationNode } from "../../modules/CSVParser/MoleculesClassification.js";

const filesPath = path.resolve("test", "ParserTests", "CSVFiles");
const snapshotsPath = path.resolve("test", "ParserTests", "snapshots");

describe("Test if values are well imported", function () {
  const files_ok = [
    {
      name: "molecules.xlsx",
      snapshot: "molecules.json",
      expectation: expectations.first_version,
    },
    {
      name: "molecules_movedColumns.xlsx",
      snapshot: "molecules.json",
      expectation: expectations.first_version,
    },
  ];

  for (let file of files_ok) {
    describe(`File : ${file.name}`, () => {
      let data;

      before("Import data", (done) => {
        parseCSV(path.resolve(filesPath, file.name), (errors, json) => {
          if (errors) {
            console.table(errors);
          } else {
            data = JSON.parse(json);
            done();
          }
        });
      });

      it("Imported data are equals to its snapshot", function (done) {
        if (!file.snapshot) {
          this.skip();
        }
        let expectedData = fs.readFileSync(
          path.resolve(snapshotsPath, file.snapshot)
        );
        expect(data).to.be.deep.equals(JSON.parse(expectedData));
        done();
      });

      for (let classification of ["systems", "classes"]) {
        it(`Classification : ${classification}`, (done) => {
          const expectedValues = file.expectation[classification];

          const names = getAllClassificationValues(
            data[classification],
            toName
          );
          const ids = getAllClassificationValues(data[classification], toId);

          expectNotContainsDuplication(ids, "Unique ids");

          expect(names, "Good number of name").to.have.length(
            expectedValues.all.length
          );
          expect(ids, "Good number of ids").to.have.length(
            expectedValues.all.length
          );

          expectSameContent(
            expectedValues.all,
            names,
            "Values are same than expected"
          );

          for (let expected of expectedValues.contains) {
            let value = getClassificationValue(
              data[classification],
              expected.name
            );

            expect(value, `Value '${expected.name}' not found.`).to.not.be
              .undefined;

            expectSameContent(
              expected.children,
              value.children.map(toName),
              `'${expected.name}' has same children than expected`
            );
          }

          done();
        });
      }

      for (let property of ["side_effects", "interactions", "indications"]) {
        it(`Property : ${property}`, function (done) {
          const expectedNames = file.expectation[property];
          const values = data[property];

          expect(values).to.have.length(expectedNames.length);

          expectNotContainsDuplication(
            values.map((v) => v.id),
            "Unique ids"
          );

          expectSameContent(
            expectedNames,
            values.map((v) => v.name),
            "Same values"
          );

          done();
        });
      }

      for (let expected of expectations.first_version.molecules) {
        it(`Molecule : ${expected.dci}`, (done) => {
          const molecule = getMoleculeByDci(data, expected.dci);

          expect(molecule, `| Molecule not found : ${expected.dci} |`).not
            .undefined;

          for (let classification of ["systems", "classes"]) {
            const value = getClassificationValue(
              data[classification],
              expected[classification]
            );

            expect(value, `| Class not found : ${expected[classification]} |`)
              .not.undefined;

            expect(value.id, `| Invalid class |`).equals(
              molecule[classification]
            );
          }

          done();
        });
      }

      // it("Molecules : Intrinsic properties", (done) => {
      //   let zanamivir = getMoleculeByDci(data, "ZANAMIVIR");

      //   const moleculesDci = data.molecules.map(toDci);

      //   expect(moleculesDci).to.have.length(140);
      //   expect(containsDuplication(moleculesDci)).to.false;
      //   expect(zanamivir.level_easy).to.be.equals(0);
      //   expect(zanamivir.level_hard).to.be.equals(1);

      //   done();
      // });

      // it("Molecules : Correct classes", (done) => {
      //   expectMoleculeHasClass(
      //     data,
      //     "PIVMECILLINAM",
      //     "PENICILLINES A LARGE SPECTRE"
      //   );
      //   expectMoleculeHasClass(
      //     data,
      //     "CEFEPIME",
      //     "CEPHALOSPORINE DE 3EME GENERATION"
      //   );
      //   expectMoleculeHasClass(data, "METHYLENECYCLINE", "TETRACYCLINES");

      //   done();
      // });
    });
  }
});

describe("Tests for errors occurred while parsing an incorrectly formatted file", function () {
  it("Empty file", (done) => {
    done();
  });
});

// ***** INTERNAL FUNCTIONS *****

/**
 * Test if an array contains duplications
 * @param {[]} array
 */
function expectNotContainsDuplication(array, message = "") {
  expect(
    array.length === [...new Set(array)].length,
    `| ${message} : Array do contains duplications |`
  ).to.be.true;
}

function expectSameContent(expected, actual, description = "") {
  for (let e of expected) {
    expect(actual).contains(e, `| ${description} : Missing value : '${e}' |`);
  }
  for (let e of actual) {
    expect(expected).contains(e, `| ${description} : Invalid value : '${e}' |`);
  }
}

/**
 * Return an array of all node of all level of a classification
 * @param {ClassificationNode[]} classification
 * @returns {ClassificationNode[]}
 */
function flattenClassification(classification) {
  function flattenNode(node) {
    let res = [node];
    for (let child of node.children) {
      res.push(...flattenNode(child));
    }
    return res;
  }

  const res = [];
  for (let node of classification) {
    res.push(...flattenNode(node));
  }
  return res;
}

/**
 * Find a molecule by its dci
 * @param {object} data
 * @param {string} dci
 */
function getMoleculeByDci(data, dci) {
  return data.molecules.find((m) => m.dci === dci);
}

/**
 * Find a system by its name
 * @param {ClassificationNode[]} classification
 * @param {string} name
 */
function getClassificationValue(classification, name) {
  return getAllClassificationValues(classification).find(
    (classe) => classe.name === name
  );
}

/**
 * Get all values of a classification
 * @param {ClassificationNode[]} classification
 * @param {function} filter
 */
function getAllClassificationValues(classification, filter = identity) {
  return flattenClassification(classification).map(filter);
}

// Filters
const toId = (object) => object.id;
const toName = (object) => object.name;

const identity = (e) => e;
