import chai from "chai";

import {
  analyseImagesFilenames,
  ImagesAnalyzerWarning,
} from "../../global/images_importation/imagesAnayzer.js";
import { forceTruncateTables, insertData } from "../index.test.js";

const { expect } = chai;

const tests = [
  {
    filenames: [
      "tenofovir.png",
      "aciclovir.png",
      "dar=navir.png",
      "entécavir.png",
      "raltégravir.png",
      "adefovir.png",
      "dasabuvir.png",
      "etravirine.png",
      "letermovir.png",
      "ribavirine.png",
      "trifluorothymidine.png",
      "amantadine.png",
      "dolutégravir.png",
      "fosamprenavir.png",
      "lédipasvir.png",
      "&ritonavir.png",
      "valganciclovir.png",
      "atazanavir.png",
      "doravirine.png",
      "foscarnet.png",
      "maraviroc.png",
      "saquinavir.png",
      "velpatasvir.png",
      "azidothymidine ou zidovudineou AZT.png",
      "efavirenz.png",
      "ganciclovir.png",
      "nevirapine.png",
      "sofosbuvir$.png",
      "voxilaprévir.png",
      "boceprevir.png",
      "elbasvir.png",
      "glécaprévir.png",
      "ombitasvir.png",
      "ZanamIvir.png",
      "zanamîvir.png",
    ],
    warnings: [
      { code: ImagesAnalyzerWarning.DUPLICATE_IMAGES, count: 1 },
      { code: ImagesAnalyzerWarning.UNKNOWN_MOLECULES, count: 13 },
      { code: ImagesAnalyzerWarning.INVALID_MOLECULE, count: 3 },
    ],
  },
];

const warningsCounter = (warnings) => (code) =>
  warnings.reduce((count, warning) => count + (warning.code === code), 0);

describe("Analyze filenames", () => {
  before("Insert data", (done) => {
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
