import path from "path";
import chai from "chai";
import mocha from "mocha";
import fs from "fs";
import deepEqualAnyOrder from "deep-equal-in-any-order";

import { parseCSV } from "../../modules/data_importer/csv_parser/Parser.js";
import { expectations } from "./expectations.js";
// eslint-disable-next-line no-unused-vars
import { ClassificationNode } from "../../modules/data_importer/csv_parser/MoleculesClassification.js";
import { HeaderErrors } from "../../modules/data_importer/csv_parser/HeaderChecker.js";

chai.use(deepEqualAnyOrder);
const { before } = mocha;
const { expect } = chai;

const filesFolderPath = path.resolve("test", "csv_parser", "files");
const badFilesFolderPath = path.resolve(filesFolderPath, "bad_formatted_files");
const snapshotsFolderPath = path.resolve("test", "csv_parser", "snapshots");

describe("Test if values are well imported", function () {
  const files = [
    {
      name: "molecules.csv",
      snapshot: "molecules.json",
      expectation: expectations.first_version,
    },
    {
      name: "molecules_moved_columns.csv",
      snapshot: "moved_columns.json",
      expectation: expectations.first_version,
    },
    {
      name: "molecules_little_sample.csv",
      snapshot: "sample.json",
      expectation: expectations.little_sample,
    },
    {
      name: "molecules_only_dci.csv",
      snapshot: "only_dci.json",
      expectation: expectations.only_dci,
    },
    {
      name: "molecules_empty.csv",
      snapshot: "empty.json",
      expectation: expectations.empty,
    },
    {
      name: "molecules_separated_rows.csv",
      snapshot: "separated_rows.json",
      expectation: expectations.first_version,
    },
  ];

  for (let file of files) {
    describe(`File : ${file.name}`, () => {
      let data;

      before("Import data", (done) => {
        parseCSV(path.resolve(filesFolderPath, file.name))
          .then((json) => {
            data = JSON.parse(json);
            done();
          })
          .catch((error) => {
            expect(error).to.be.null;
          });
      });

      it("Imported data are equals to its snapshot", function (done) {
        if (!file.snapshot) {
          this.skip();
        }
        let expectedData = fs.readFileSync(path.resolve(snapshotsFolderPath, file.snapshot));
        expect(data).to.be.deep.equals(JSON.parse(expectedData));
        done();
      });

      it("Good number of molecules", function (done) {
        expect(data.molecules.length).to.be.equals(file.expectation.number_of_molecules);
        done();
      });

      for (let classification of ["systems", "classes"]) {
        it(`Classification : ${classification}`, (done) => {
          const expectedValues = file.expectation[classification];

          const names = getAllClassificationValues(data[classification], toName);
          const ids = getAllClassificationValues(data[classification], toId);

          expectNotContainsDuplication(ids, "Unique ids");

          expect(expectedValues.all, "Values are same than expected").to.be.deep.equalInAnyOrder(names);

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

      for (let property of ["side_effects", "interactions", "indications"]) {
        it(`Property : ${property}`, function (done) {
          const expectedNames = file.expectation[property];
          const values = data[property];

          expect(values).to.have.length(expectedNames.length);

          expectNotContainsDuplication(
            values.map((v) => v.id),
            "Unique ids"
          );

          expect(expectedNames, "Same values").to.be.deep.equalInAnyOrder(values.map((v) => v.name));

          done();
        });
      }

      for (let expected of file.expectation.molecules) {
        it(`Molecule : ${expected.dci}`, (done) => {
          const molecule = getMoleculeByDci(data, expected.dci);

          expect(molecule, `| Molecule not found : ${expected.dci} |`).not.undefined;

          for (let classification of ["systems", "classes"]) {
            const moleculeProperty = classification.replace("classes", "class").replace("systems", "system");
            if (expected[moleculeProperty] === null) {
              continue;
            }
            const value = getClassificationValue(data[classification], expected[moleculeProperty]);
            expect(value, `| ${classification} not found : ${expected[moleculeProperty]} |`).not.undefined;
            expect(value.id, `| Invalid class |`).equals(molecule[moleculeProperty]);
          }

          for (let property of ["skeletal_formule", "ntr", "level_easy", "level_hard"]) {
            expect(molecule[property], `| Invalid property ${property} |`).equals(expected[property]);
          }

          for (let property of ["indications", "interactions", "side_effects"]) {
            let expectedValues = expected[property].map((value) => {
              let found = getPropertyValue(data[property], value);
              expect(found, `| Invalid value '${value}' for property ${property} |`).not.undefined;
              return found.id;
            });
            expect(molecule[property], `| Invalid property : ${property} |`).deep.equalInAnyOrder(expectedValues);
          }

          done();
        });
      }
    });
  }
});

describe("Tests for errors occurred while parsing an incorrectly formatted file", function () {
  const bad_files = [
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
      name: "missing_skeletal_formule.csv",
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
      errors: [HeaderErrors.INVALID_COLUMN, HeaderErrors.INVALID_COLUMN, HeaderErrors.MISSING_COLUMN],
    },
    {
      name: "empty_column.csv",
      errors: [HeaderErrors.EMPTY_COLUMN],
    },
  ];

  for (const file of bad_files) {
    it(`File : ${file.name}`, async () => {
      try {
        const json = await parseCSV(path.resolve(badFilesFolderPath, file.name));
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
  expect(array.length === [...new Set(array)].length, `| ${message} : Array do contains duplications |`).to.be.true;
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
