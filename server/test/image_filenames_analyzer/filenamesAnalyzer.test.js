import chai from "chai";

import { analyseImageFilenames, ImagesAnalyzerWarning } from "../../global/ImageFilesAnalyzer.js";
import { forceTruncateTables, insertData } from "../index.test.js";

const { expect } = chai;

const tests = [
  {
    filenames: [
      "abacavir",
      "daclatasvir",
      "entravirine",
      "indinavir",
      "pibrentasvir",
      "tenofovir",
      "aciclovir",
      "dar-navir",
      "entécavir",
      "lamivudine",
      "raltégravir",
      "tipranavir",
      "adefovir",
      "dasabuvir",
      "etravirine",
      "letermovir",
      "ribavirine",
      "trifluorothymidine",
      "amantadine",
      "didanosine",
      "famciclovir",
      "lopinavir",
      "rilpivirine",
      "valaciclovir",
      "aseltamivir",
      "dolutégravir",
      "fosamprenavir",
      "lédipasvir",
      "ritonavir",
      "valganciclovir",
      "atazanavir",
      "doravirine",
      "foscarnet",
      "maraviroc",
      "saquinavir",
      "velpatasvir",
      "azidothymidine ou zidovudineou AZT",
      "efavirenz",
      "ganciclovir",
      "nevirapine",
      "sofosbuvir$",
      "voxilaprévir",
      "boceprevir",
      "elbasvir",
      "glécaprévir",
      "ombitasvir",
      "stavudine",
      "zanamivir",
      "cidofovir",
      "eltégravir",
      "grazoprévir",
      "oseltamivir",
      "telaprevir",
      "cobicistat,",
      "zanamîvir",
      "entracitabine",
      "ibacitabine",
      "paritaprevir",
      "telbivudine",
    ],
    warnings: [
      { code: ImagesAnalyzerWarning.DUPLICATE_IMAGES, count: 1 },
      { code: ImagesAnalyzerWarning.UNKNOWN_MOLECULES, count: 26 },
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
      const warnings = await analyseImageFilenames(test.filenames);
      const counter = warningsCounter(warnings);
      test.warnings.forEach((warning) =>
        expect(counter(warning.code), "Type " + warning.code).equals(warning.count)
      );
    });
  });
});
