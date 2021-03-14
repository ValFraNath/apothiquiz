import fs from "fs";
import path from "path";

import chai from "chai";
import deepEqualAnyOrder from "deep-equal-in-any-order";
import mocha from "mocha";

import { HeaderErrors } from "../../../global/csv_reader/HeaderChecker.js";

import { parseMoleculesFromCsv } from "../../../global/molecules_importation/moleculesParser.js";

import { expectations } from "./expectations.js";

chai.use(deepEqualAnyOrder);
const { before } = mocha;
const { expect } = chai;

const filesFolderPath = path.resolve("test", "molecules_importation", "parser", "files");
const badFilesFolderPath = path.resolve(filesFolderPath, "bad_formatted_files");
const snapshotsFolderPath = path.resolve("test", "molecules_importation", "parser", "snapshots");

describe("Test if values are well imported", function () {
  const files = [
    {
      name: "molecules.csv",
      snapshot: "molecules.json",
      expectation: expectations.firstVersion,
    },
    {
      name: "molecules_moved_columns.csv",
      snapshot: "moved_columns.json",
      expectation: expectations.firstVersion,
    },
    {
      name: "molecules_little_sample.csv",
      snapshot: "sample.json",
      expectation: expectations.littleSample,
    },
    {
      name: "molecules_only_dci.csv",
      snapshot: "only_dci.json",
      expectation: expectations.onlyDCI,
    },
    {
      name: "molecules_empty.csv",
      snapshot: "empty.json",
      expectation: expectations.empty,
    },
    {
      name: "molecules_separated_rows.csv",
      snapshot: "separated_rows.json",
      expectation: expectations.firstVersion,
    },
  ];

  for (let file of files) {
    describe(`File : ${file.name}`, () => {
      let data;

      before("Import data", async () => {
        const json = (
          await parseMoleculesFromCsv(path.resolve(filesFolderPath, file.name))
        ).toJSON();

        data = JSON.parse(json);
      });

      it("Imported data are equals to its snapshot", function (done) {
        if (!file.snapshot) {
          this.skip();
        }
        // Uncomment the following line to update the snapshot files, /!\ Make sure the snapshots are valid !
        //fs.writeFileSync(path.resolve(snapshotsFolderPath, file.snapshot), JSON.stringify(data));
        let expectedData = fs.readFileSync(path.resolve(snapshotsFolderPath, file.snapshot));
        expect(data).to.be.deep.equals(JSON.parse(expectedData));
        done();
      });

      it("Good number of molecules", function (done) {
        expect(data.molecules.length).to.be.equals(file.expectation.numberOfMolecules);
        done();
      });

      for (let classification of ["system", "class"]) {
        it(`Classification : ${classification}`, (done) => {
          const expectedValues = file.expectation[classification];

          const names = getAllClassificationValues(data[classification], toName);
          const ids = getAllClassificationValues(data[classification], toId);

          expectNotContainsDuplication(ids, "Unique ids");

          expect(expectedValues.all, "Values are same than expected").to.be.deep.equalInAnyOrder(
            names
          );

          for (let expectedNode of expectedValues.nodes) {
            let value = getClassificationValue(data[classification], expectedNode.name);

            expect(value, `Value '${expectedNode.name}' not found.`).to.not.be.undefined;

            expect(
              expectedNode.children,
              `'${expectedNode.name}' has same children than expected`
            ).to.be.deep.equalInAnyOrder(value.children.map(toName));
          }
          expect(names, "Good number of name").to.have.length(expectedValues.all.length);
          expect(ids, "Good number of ids").to.have.length(expectedValues.all.length);

          done();
        });
      }

      for (let property of ["sideEffects", "interactions", "indications"]) {
        it(`Property : ${property}`, function (done) {
          const expectedNames = file.expectation[property];
          const values = data[property];

          expect(values).to.have.length(expectedNames.length);

          expectNotContainsDuplication(
            values.map((v) => v.id),
            "Unique ids"
          );

          expect(expectedNames, "Same values").to.be.deep.equalInAnyOrder(
            values.map((v) => v.name)
          );

          done();
        });
      }

      for (let expected of file.expectation.molecules) {
        it(`Molecule : ${expected.dci}`, (done) => {
          const molecule = getMoleculeByDci(data, expected.dci);

          expect(molecule, `| Molecule not found : ${expected.dci} |`).not.undefined;

          for (let classification of ["system", "class"]) {
            if (expected[classification] === null) {
              continue;
            }
            const value = getClassificationValue(data[classification], expected[classification]);
            expect(value, `| ${classification} not found : ${expected[classification]} |`).not
              .undefined;
            expect(value.id, `| Invalid class |`).equals(molecule[classification]);
          }

          for (let property of ["skeletalFormula", "ntr", "levelEasy", "levelHard"]) {
            expect(molecule[property], `| Invalid property ${property} |`).equals(
              expected[property]
            );
          }

          for (let property of ["indications", "interactions", "sideEffects"]) {
            let expectedValues = expected[property].map((value) => {
              let found = getPropertyValue(data[property], value);
              expect(found, `| Invalid value '${value}' for property ${property} |`).not.undefined;
              return found.id;
            });
            expect(molecule[property], `| Invalid property : ${property} |`).deep.equalInAnyOrder(
              expectedValues
            );
          }

          done();
        });
      }
    });
  }
});

describe("Tests for errors occurred while parsing an incorrectly formatted file", function () {
  const badFiles = [
    {
      name: "empty_file.csv",
      errors: [HeaderErrors.EMPTY_FILE],
    },
    {
      name: "invalid_column.csv",
      errors: [HeaderErrors.INVALID_COLUMN],
    },
    {
      name: "missing_side_effects.csv",
      errors: [HeaderErrors.MISSING_COLUMN],
    },
    {
      name: "missing_skeletal_formula.csv",
      errors: [HeaderErrors.MISSING_COLUMN],
    },
    {
      name: "bad_grouped_property.csv",
      errors: [HeaderErrors.BAD_COLUMNS_GROUP],
    },
    {
      name: "bad_hierarchical_levels.csv",
      errors: [HeaderErrors.BAD_HIERARCHICAL_COLUMNS_ORDER],
    },
    {
      name: "bad_grouped_classification.csv",
      errors: [HeaderErrors.BAD_COLUMNS_GROUP, HeaderErrors.BAD_COLUMNS_GROUP],
    },
    {
      name: "missing_classification.csv",
      errors: [HeaderErrors.MISSING_COLUMN],
    },
    {
      name: "several_errors.csv",
      errors: [
        HeaderErrors.INVALID_COLUMN,
        HeaderErrors.INVALID_COLUMN,
        HeaderErrors.MISSING_COLUMN,
      ],
    },
    {
      name: "empty_column.csv",
      errors: [HeaderErrors.EMPTY_COLUMN],
    },
  ];

  for (const file of badFiles) {
    it(`File : ${file.name}`, async () => {
      try {
        const json = await parseMoleculesFromCsv(path.resolve(badFilesFolderPath, file.name));
        expect(json === null, "The parsing is not supposed to pass").be.true;
      } catch (errors) {
        if (!HeaderErrors.isInstance(errors)) {
          throw errors;
        }

        const errorsCodes = errors.errors.map((error) => error.code);
        expect(errorsCodes).to.be.deep.equalInAnyOrder(file.errors);
      }
    });
  }
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
  return getAllClassificationValues(classification).find((classe) => classe.name === name);
}

/**
 * Get all values of a classification
 * @param {ClassificationNode[]} classification
 * @param {function} filter
 */
function getAllClassificationValues(classification, filter = identity) {
  return flattenClassification(classification).map(filter);
}

/**
 * Find a value in a property
 * @param {{id : number, name : string}[]} property
 * @param {string} name
 */
function getPropertyValue(property, name) {
  return property.find((value) => value.name === name);
}

// Filters
const toId = (object) => object.id;
const toName = (object) => object.name;
const identity = (e) => e;
