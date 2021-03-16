import chai from "chai";

import ImagesList, { IMAGE_WARNINGS } from "../../global/images_importation/ImagesList.js";
import { forceTruncateTables, insertData } from "../index.test.js";

const { expect } = chai;

const tests = [
  {
    filenames: ["tenofovir  àlafenamîde.png", "aciclövir.svg", "amantadine.jpeg"],
    warnings: [
      { code: IMAGE_WARNINGS.DUPLICATED_IMAGES, count: 0 },
      { code: IMAGE_WARNINGS.UNKNOWN_MOLECULE, count: 0 },
      { code: IMAGE_WARNINGS.INVALID_MOLECULE, count: 0 },
      { code: IMAGE_WARNINGS.INVALID_FORMAT, count: 0 },
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
      { code: IMAGE_WARNINGS.DUPLICATED_IMAGES, count: 2 },
      { code: IMAGE_WARNINGS.UNKNOWN_MOLECULE, count: 0 },
      { code: IMAGE_WARNINGS.INVALID_MOLECULE, count: 0 },
      { code: IMAGE_WARNINGS.INVALID_FORMAT, count: 0 },
    ],
  },
  {
    filenames: ["amentadine.tex", "lamivudine.odt", "tinidazole", "pyrantel.jpEg ", "   "],
    warnings: [
      { code: IMAGE_WARNINGS.DUPLICATED_IMAGES, count: 0 },
      { code: IMAGE_WARNINGS.UNKNOWN_MOLECULE, count: 2 },
      { code: IMAGE_WARNINGS.INVALID_MOLECULE, count: 1 },
      { code: IMAGE_WARNINGS.INVALID_FORMAT, count: 4 },
    ],
  },
  {
    filenames: ["$amantadine.png", "am%antadine.svg", "lamivudine&.svg"],
    warnings: [
      { code: IMAGE_WARNINGS.DUPLICATED_IMAGES, count: 0 },
      { code: IMAGE_WARNINGS.UNKNOWN_MOLECULE, count: 3 },
      { code: IMAGE_WARNINGS.INVALID_MOLECULE, count: 3 },
      { code: IMAGE_WARNINGS.INVALID_FORMAT, count: 0 },
    ],
  },
  {
    filenames: ["amaantadine.png", "train.svg", "avion.png", "pyrantel.png"],
    warnings: [
      { code: IMAGE_WARNINGS.DUPLICATED_IMAGES, count: 0 },
      { code: IMAGE_WARNINGS.UNKNOWN_MOLECULE, count: 3 },
      { code: IMAGE_WARNINGS.INVALID_MOLECULE, count: 0 },
      { code: IMAGE_WARNINGS.INVALID_FORMAT, count: 0 },
    ],
  },
];

const warningsCounter = (warnings) => (code) =>
  warnings.reduce((count, warning) => count + (warning.code === code), 0);

describe("Analyze filenames", () => {
  before("Insert data", async function () {
    this.timeout(10000);
    await forceTruncateTables(
      "molecule",
      "class",
      "system",
      "property",
      "property_value",
      "molecule_property"
    );
    await insertData("molecules.sql");
  });

  tests.forEach((test, i) => {
    it(`Good expected warnings : ${i + 1}`, async () => {
      const warnings = await new ImagesList(test.filenames).analyze();
      const counter = warningsCounter(warnings);
      test.warnings.forEach((warning) =>
        expect(counter(warning.code), "Type " + warning.code).equals(warning.count)
      );
    });
  });
});
