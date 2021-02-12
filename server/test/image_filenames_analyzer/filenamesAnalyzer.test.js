import chai from "chai";

import { analyseImageFilenames } from "../../global/ImageFilesAnalyzer.js";
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
      "darunavir",
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
      "'azidothymidineouzidovudineouAZT",
      "'efavirenz",
      "ganciclovir",
      "nevirapine",
      "sofosbuvir",
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
      "cobicistat",
      "entracitabine",
      "ibacitabine",
      "paritaprevir",
      "telbivudine",
    ],
    warnings: [],
  },
];

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
      analyseImageFilenames(test.filenames).then((warnings) => {
        console.log(warnings, warnings.length, test.filenames.length);
      });
    });
  });
});
