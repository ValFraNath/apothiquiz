import path from "path";

import chai from "chai";

import { queryPromise } from "../../../db/database.js";
import { AnalyzerWarning } from "../../../global/importationUtils.js";
import { CLASSIFICATION_WARNINGS } from "../../../global/molecules_importation/Classification.js";
import { MOLECULE_WARNINGS } from "../../../global/molecules_importation/MoleculesList.js";
import { PROPERTY_WARNINGS } from "../../../global/molecules_importation/Property.js";
import { parseMoleculesFromCsv } from "../../../global/molecules_importation/moleculesParser.js";
import { forceTruncateTables } from "../../index.test.js";

const { expect } = chai;

const files = [
  {
    name: "duplicatesMolecules.csv",
    warnings: [
      { code: MOLECULE_WARNINGS.DUPLICATED_MOLECULES, count: 2 },
      { code: MOLECULE_WARNINGS.TOO_LONG_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.INVALID_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.TOO_CLOSE_MOLECULES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.DUPLICATED_NODES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.TOO_CLOSE_CLASSIFICATION_VALUES, count: 2 },
      { code: CLASSIFICATION_WARNINGS.INVALID_CLASSIFICATION_VALUE_TYPE, count: 0 },
      { code: CLASSIFICATION_WARNINGS.TOO_LONG_CLASSIFICATION_VALUE, count: 0 },
      { code: PROPERTY_WARNINGS.INVALID_PROPERTY_VALUE_TYPE, count: 0 },
      { code: PROPERTY_WARNINGS.TOO_CLOSE_PROPERTY_VALUES, count: 1 },
      { code: PROPERTY_WARNINGS.TOO_LONG_PROPERTY_VALUE, count: 0 },
    ],
  },
  {
    name: "duplicatesNodes.csv",
    warnings: [
      { code: MOLECULE_WARNINGS.DUPLICATED_MOLECULES, count: 0 },
      { code: MOLECULE_WARNINGS.TOO_LONG_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.INVALID_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.TOO_CLOSE_MOLECULES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.DUPLICATED_NODES, count: 2 },
      { code: CLASSIFICATION_WARNINGS.TOO_CLOSE_CLASSIFICATION_VALUES, count: 3 },
      { code: CLASSIFICATION_WARNINGS.INVALID_CLASSIFICATION_VALUE_TYPE, count: 0 },
      { code: CLASSIFICATION_WARNINGS.TOO_LONG_CLASSIFICATION_VALUE, count: 0 },
      { code: PROPERTY_WARNINGS.INVALID_PROPERTY_VALUE_TYPE, count: 0 },
      { code: PROPERTY_WARNINGS.TOO_CLOSE_PROPERTY_VALUES, count: 1 },
      { code: PROPERTY_WARNINGS.TOO_LONG_PROPERTY_VALUE, count: 0 },
    ],
  },
  {
    name: "tooLongNames.csv",
    warnings: [
      { code: MOLECULE_WARNINGS.DUPLICATED_MOLECULES, count: 0 },
      { code: MOLECULE_WARNINGS.TOO_LONG_DCI, count: 1 },
      { code: MOLECULE_WARNINGS.INVALID_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.TOO_CLOSE_MOLECULES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.DUPLICATED_NODES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.TOO_CLOSE_CLASSIFICATION_VALUES, count: 2 },
      { code: CLASSIFICATION_WARNINGS.INVALID_CLASSIFICATION_VALUE_TYPE, count: 0 },
      { code: CLASSIFICATION_WARNINGS.TOO_LONG_CLASSIFICATION_VALUE, count: 1 },
      { code: PROPERTY_WARNINGS.INVALID_PROPERTY_VALUE_TYPE, count: 0 },
      { code: PROPERTY_WARNINGS.TOO_CLOSE_PROPERTY_VALUES, count: 1 },
      { code: PROPERTY_WARNINGS.TOO_LONG_PROPERTY_VALUE, count: 0 },
    ],
  },
  {
    name: "badTypes.csv",
    warnings: [
      { code: MOLECULE_WARNINGS.DUPLICATED_MOLECULES, count: 0 },
      { code: MOLECULE_WARNINGS.TOO_LONG_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.INVALID_DCI, count: 1 },
      { code: MOLECULE_WARNINGS.TOO_CLOSE_MOLECULES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.DUPLICATED_NODES, count: 2 },
      { code: CLASSIFICATION_WARNINGS.TOO_CLOSE_CLASSIFICATION_VALUES, count: 3 },
      { code: CLASSIFICATION_WARNINGS.INVALID_CLASSIFICATION_VALUE_TYPE, count: 4 },
      { code: CLASSIFICATION_WARNINGS.TOO_LONG_CLASSIFICATION_VALUE, count: 0 },
      { code: PROPERTY_WARNINGS.INVALID_PROPERTY_VALUE_TYPE, count: 0 },
      { code: PROPERTY_WARNINGS.TOO_CLOSE_PROPERTY_VALUES, count: 1 },
      { code: PROPERTY_WARNINGS.TOO_LONG_PROPERTY_VALUE, count: 0 },
    ],
  },
  {
    name: "invalid_dci.csv",
    warnings: [
      { code: MOLECULE_WARNINGS.DUPLICATED_MOLECULES, count: 0 },
      { code: MOLECULE_WARNINGS.TOO_LONG_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.INVALID_DCI, count: 4 },
      { code: MOLECULE_WARNINGS.TOO_CLOSE_MOLECULES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.DUPLICATED_NODES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.TOO_CLOSE_CLASSIFICATION_VALUES, count: 2 },
      { code: CLASSIFICATION_WARNINGS.INVALID_CLASSIFICATION_VALUE_TYPE, count: 0 },
      { code: CLASSIFICATION_WARNINGS.TOO_LONG_CLASSIFICATION_VALUE, count: 0 },
      { code: PROPERTY_WARNINGS.INVALID_PROPERTY_VALUE_TYPE, count: 0 },
      { code: PROPERTY_WARNINGS.TOO_CLOSE_PROPERTY_VALUES, count: 1 },
      { code: PROPERTY_WARNINGS.TOO_LONG_PROPERTY_VALUE, count: 0 },
    ],
  },
  {
    name: "worst.csv",
    warnings: [
      { code: MOLECULE_WARNINGS.DUPLICATED_MOLECULES, count: 1 },
      { code: MOLECULE_WARNINGS.TOO_LONG_DCI, count: 0 },
      { code: MOLECULE_WARNINGS.INVALID_DCI, count: 2 },
      { code: MOLECULE_WARNINGS.TOO_CLOSE_MOLECULES, count: 0 },
      { code: CLASSIFICATION_WARNINGS.DUPLICATED_NODES, count: 1 },
      { code: CLASSIFICATION_WARNINGS.TOO_CLOSE_CLASSIFICATION_VALUES, count: 2 },
      { code: CLASSIFICATION_WARNINGS.INVALID_CLASSIFICATION_VALUE_TYPE, count: 1 },
      { code: CLASSIFICATION_WARNINGS.TOO_LONG_CLASSIFICATION_VALUE, count: 0 },
      { code: PROPERTY_WARNINGS.INVALID_PROPERTY_VALUE_TYPE, count: 1 },
      { code: PROPERTY_WARNINGS.TOO_CLOSE_PROPERTY_VALUES, count: 1 },
      { code: PROPERTY_WARNINGS.TOO_LONG_PROPERTY_VALUE, count: 1 },
    ],
  },
];

const FILES_DIR = path.resolve("test", "molecules_importation", "analyzer", "files");

const warningsCounter = (warnings) => (code) =>
  warnings.reduce((count, warning) => count + (warning.code === code), 0);

describe("Molecules analyzer", () => {
  for (const file of files) {
    describe(`File : ${file.name}`, () => {
      let data;
      before("Parse file", async () => {
        data = await parseMoleculesFromCsv(path.resolve(FILES_DIR, file.name));
      });

      before("Clear database", function (done) {
        this.timeout(10000);
        forceTruncateTables(
          "molecule",
          "class",
          "system",
          "property",
          "property_value",
          "molecule_property"
        ).then(done);
      });

      it("Expected warnings", async () => {
        const warnings = data.analyze();
        const counter = warningsCounter(warnings);
        file.warnings.forEach((warning) =>
          expect(counter(warning.code), "Type " + warning.code).equals(warning.count)
        );
      });

      it("Can import without errors", async () => {
        const sql = data.importSql();
        await queryPromise(sql);
      });
    });
  }
});
