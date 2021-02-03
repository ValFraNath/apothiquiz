import path from "path";

import chai from "chai";

import { queryPromise } from "../../db/database.js";
import { analyzeData, AnalyzerWarning } from "../../global/molecules_analyzer/moleculesAnalyzer.js";
import { createSqlToInsertAllData } from "../../global/molecules_importer/moleculesImporter.js";
import { parseMoleculesFromCsv } from "../../global/molecules_parser/Parser.js";
import { forceTruncateTables } from "../index.test.js";

const { expect } = chai;

const files = [
  {
    name: "duplicatesMolecules.csv",
    warnings: [
      { type: AnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 1 },
      { type: AnalyzerWarning.TOO_LONG_VALUE, count: 0 },
      { type: AnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 0 },
      { type: AnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { type: AnalyzerWarning.INVALID_TYPE, count: 0 },
    ],
  },
  {
    name: "duplicatesNodes.csv",
    warnings: [
      { type: AnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 0 },
      { type: AnalyzerWarning.TOO_LONG_VALUE, count: 0 },
      { type: AnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 2 },
      { type: AnalyzerWarning.TOO_CLOSE_VALUES, count: 4 },
      { type: AnalyzerWarning.INVALID_TYPE, count: 0 },
    ],
  },
  {
    name: "tooLongNames.csv",
    warnings: [
      { type: AnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 0 },
      { type: AnalyzerWarning.TOO_LONG_VALUE, count: 1 },
      { type: AnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 0 },
      { type: AnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { type: AnalyzerWarning.INVALID_TYPE, count: 0 },
    ],
  },
  {
    name: "badTypes.csv",
    warnings: [
      { type: AnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 0 },
      { type: AnalyzerWarning.TOO_LONG_VALUE, count: 0 },
      { type: AnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 2 },
      { type: AnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { type: AnalyzerWarning.INVALID_TYPE, count: 6 },
    ],
  },
  {
    name: "worst.csv",
    warnings: [
      { type: AnalyzerWarning.DUPLICATE_UNIQUE_VALUE, count: 1 },
      { type: AnalyzerWarning.TOO_LONG_VALUE, count: 1 },
      { type: AnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE, count: 1 },
      { type: AnalyzerWarning.TOO_CLOSE_VALUES, count: 3 },
      { type: AnalyzerWarning.INVALID_TYPE, count: 4 },
    ],
  },
];

const FILES_DIR = path.resolve("test", "molecules_analyzer", "files");

const warningsCounter = (warnings) => (type) =>
  warnings.reduce((count, warning) => count + (warning.type === type), 0);

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
          expect(counter(warning.type), "Type " + warning.type).equals(warning.count)
        );
      });

      it("Can import without errors", async () => {
        const sql = createSqlToInsertAllData(data);
        await queryPromise(sql);
      });
    });
  }
});
