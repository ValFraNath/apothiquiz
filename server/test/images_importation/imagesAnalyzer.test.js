import chai from "chai";

import {
  analyseImagesFilenames,
  ImagesAnalyzerWarning,
} from "../../global/images_importation/imagesAnayzer.js";
import { forceTruncateTables, insertData } from "../index.test.js";

const { expect } = chai;

const tests = [
  {
    filenames: ["tenofovir  àlafenamîde.png", "aciclövir.svg", "amantadine.jpeg"],
    warnings: [
      { code: ImagesAnalyzerWarning.DUPLICATE_IMAGES, count: 0 },
      { code: ImagesAnalyzerWarning.UNKNOWN_MOLECULES, count: 0 },
      { code: ImagesAnalyzerWarning.INVALID_MOLECULE, count: 0 },
      { code: ImagesAnalyzerWarning.BAD_FORMAT, count: 0 },
    ],
  },
  {
    filenames: [
      "   AmAnTADinE.PnG ",
      " LAMiVuDiNE.SvG  ",
      "tenofovir-alafenamide.png",
      "tenofovir_Alafenamide.jpg",
      "tenofoviR alafenamide.png",
      "lamivudine.png",
    ],
    warnings: [
      { code: ImagesAnalyzerWarning.DUPLICATE_IMAGES, count: 2 },
      { code: ImagesAnalyzerWarning.UNKNOWN_MOLECULES, count: 0 },
      { code: ImagesAnalyzerWarning.INVALID_MOLECULE, count: 0 },
      { code: ImagesAnalyzerWarning.BAD_FORMAT, count: 0 },
    ],
  },
  {
    filenames: ["amantadine.tex", "lamivudine.odt", "tinidazole", "pyrantel.jpEg ", "   "],
    warnings: [
      { code: ImagesAnalyzerWarning.DUPLICATE_IMAGES, count: 0 },
      { code: ImagesAnalyzerWarning.UNKNOWN_MOLECULES, count: 0 },
      { code: ImagesAnalyzerWarning.INVALID_MOLECULE, count: 0 },
      { code: ImagesAnalyzerWarning.BAD_FORMAT, count: 4 },
    ],
  },
  {
    filenames: ["$amantadine.png", "am%antadine.svg", "lamivudine&.svg"],
    warnings: [
      { code: ImagesAnalyzerWarning.DUPLICATE_IMAGES, count: 0 },
      { code: ImagesAnalyzerWarning.UNKNOWN_MOLECULES, count: 0 },
      { code: ImagesAnalyzerWarning.INVALID_MOLECULE, count: 3 },
      { code: ImagesAnalyzerWarning.BAD_FORMAT, count: 0 },
    ],
  },
  {
    filenames: ["amaantadine.png", "train.svg", "avion.png", "pyrantel.png"],
    warnings: [
      { code: ImagesAnalyzerWarning.DUPLICATE_IMAGES, count: 0 },
      { code: ImagesAnalyzerWarning.UNKNOWN_MOLECULES, count: 3 },
      { code: ImagesAnalyzerWarning.INVALID_MOLECULE, count: 0 },
      { code: ImagesAnalyzerWarning.BAD_FORMAT, count: 0 },
    ],
  },
];

const warningsCounter = (warnings) => (code) =>
  warnings.reduce((count, warning) => count + (warning.code === code), 0);

describe("Analyze filenames", () => {
  before("Insert data", function (done) {
    this.timeout(10000);
    forceTruncateTables(
      "molecule",
      "class",
      "system",
      "property",
      "property_value",
      "molecule_property"
    ).then(() => insertData("molecules.sql").then(done));
  });
  tests.forEach((test, i) => {
    it(`Good expected warnings : ${i + 1}`, async () => {
      const warnings = await analyseImagesFilenames(test.filenames);
      const counter = warningsCounter(warnings);
      test.warnings.forEach((warning) =>
        expect(counter(warning.code), "Type " + warning.code).equals(warning.count)
      );
    });
  });
});
