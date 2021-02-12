import path from "path";

import chai from "chai";

import { queryPromise } from "../../db/database.js";
import {
  analyzeData,
  MoleculesAnalyzerWarning,
} from "../../global/molecules_analyzer/moleculesAnalyzer.js";
import { createSqlToInsertAllData } from "../../global/molecules_importer/moleculesImporter.js";
import { parseMoleculesFromCsv } from "../../global/molecules_parser/Parser.js";
import { forceTruncateTables } from "../index.test.js";

const { expect } = chai;

const files = [
  {
    name: "duplicatesMolecules.csv",
    warnings: [
      { code: MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 1 },
      { code: MoleculesAnalyzerWarning.TOO_LONG_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 0 },
      { code: MoleculesAnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { code: MoleculesAnalyzerWarning.INVALID_TYPE, count: 0 },
      { code: MoleculesAnalyzerWarning.INVALID_DCI, count: 0 },
    ],
  },
  {
    name: "duplicatesNodes.csv",
    warnings: [
      { code: MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.TOO_LONG_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 2 },
      { code: MoleculesAnalyzerWarning.TOO_CLOSE_VALUES, count: 4 },
      { code: MoleculesAnalyzerWarning.INVALID_TYPE, count: 0 },
      { code: MoleculesAnalyzerWarning.INVALID_DCI, count: 0 },
    ],
  },
  {
    name: "tooLongNames.csv",
    warnings: [
      { code: MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.TOO_LONG_VALUE, count: 1 },
      { code: MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 0 },
      { code: MoleculesAnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { code: MoleculesAnalyzerWarning.INVALID_TYPE, count: 0 },
      { code: MoleculesAnalyzerWarning.INVALID_DCI, count: 0 },
    ],
  },
  {
    name: "badTypes.csv",
    warnings: [
      { code: MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.TOO_LONG_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 2 },
      { code: MoleculesAnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { code: MoleculesAnalyzerWarning.INVALID_TYPE, count: 6 },
      { code: MoleculesAnalyzerWarning.INVALID_DCI, count: 1 },
    ],
  },
  {
    name: "invalid_dci.csv",
    warnings: [
      { code: MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.TOO_LONG_VALUE, count: 0 },
      { code: MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 0 },
      { code: MoleculesAnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { code: MoleculesAnalyzerWarning.INVALID_TYPE, count: 0 },
      { code: MoleculesAnalyzerWarning.INVALID_DCI, count: 4 },
    ],
  },
  {
    name: "worst.csv",
    warnings: [
      { code: MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 1 },
      { code: MoleculesAnalyzerWarning.TOO_LONG_VALUE, count: 1 },
      { code: MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 1 },
      { code: MoleculesAnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { code: MoleculesAnalyzerWarning.INVALID_TYPE, count: 4 },
      { code: MoleculesAnalyzerWarning.INVALID_DCI, count: 3 },
    ],
  },
];

const FILES_DIR = path.resolve("test", "molecules_analyzer", "files");

const warningsCounter = (warnings) => (code) =>
  warnings.reduce((count, warning) => count + (warning.code === code), 0);

describe("Molecules analyzer", () => {
  for (const file of files) {
    describe(`File : ${file.name}`, () => {
      let data;
      before("Parse file", async () => {
        data = JSON.parse(await parseMoleculesFromCsv(path.resolve(FILES_DIR, file.name)));
      });

      before("Clear database", (done) => {
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
        const warnings = analyzeData(data);
        const counter = warningsCounter(warnings);
        file.warnings.forEach((warning) =>
          expect(counter(warning.code), "Type " + warning.code).equals(warning.count)
        );
      });

      it("Can import without errors", async () => {
        const sql = createSqlToInsertAllData(data);
        await queryPromise(sql);
      });
    });
  }
});
