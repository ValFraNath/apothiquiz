import chai from "chai";

import equalInAnyOrder from "deep-equal-in-any-order";

import { queryPromise } from "../../db/database.js";

import ImagesList from "../../global/importation/images-importation/ImagesList.js";
import { forceTruncateTables, insertData } from "../index.test.js";

chai.use(equalInAnyOrder);
const { expect } = chai;

const tests = [
  {
    filenames: {
      "amantadine.png": true,
      "lamivudine.jpeg": true,
      "TENOFOVIR ALAFENAMIDE.svg": true,
      "GLECAPREVIR.jpg ": true,
      "invalid filenames": false,
      "lamivudine.gif": false,
    },
    molecules: ["AMANTADINE", "LAMIVUDINE", "GLECAPREVIR", "TENOFOVIR ALAFENAMIDE"],
  },
  {
    filenames: {
      "AmanTadinE.PNg ": true,
      "  TEnoFOVIR   DisoPROXIL.sVg  ": true,
      "Am AN TADINE.svg": false,
    },
    molecules: ["AMANTADINE", "TENOFOVIR DISOPROXIL"],
  },
  {
    filenames: {
      "$amantadine.png": false,
      amantadine: false,
      "amantadine.": false,
      "LEDIPASVIR.": false,
      "lamivudine%": false,
    },
    molecules: [],
  },
  {
    filenames: {
      "amàntadîne.png": true,
      "lamïvùdÏne.jpeg": true,
      "àMantàdine.svg": true,
    },
    molecules: ["AMANTADINE", "LAMIVUDINE"],
  },
];

describe("Bind images to molecules", () => {
  before("Clear & insert data", async function () {
    this.timeout(10000);
    await forceTruncateTables(
      "molecule",
      "system",
      "class",
      "property",
      "property_value",
      "molecule_property"
    );
    await insertData("molecules.sql");
  });

  tests.forEach((test, i) => {
    const shouldBeImportedFilenames = Object.keys(test.filenames).filter((f) => test.filenames[f]);

    it(`Good imported molecules : ${i + 1}`, async () => {
      const imported = await new ImagesList(Object.keys(test.filenames)).bindImagesToMolecules();
      expect(imported).deep.equalInAnyOrder(shouldBeImportedFilenames);
    });

    it(`Molecules updated in database : ${i + 1}`, async () => {
      const list = (
        await queryPromise("SELECT mo_dci  FROM molecule WHERE mo_image IS NOT NULL;")
      ).map((row) => row.mo_dci);

      expect(list).deep.equalInAnyOrder(test.molecules);
    });
  });
});
