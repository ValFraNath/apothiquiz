import chai from "chai";
import chaiHttp from "chai-http";
chai.use(chaiHttp);

import { importData, ImportationError } from "../modules/data-importer.js";

describe("Good data importation from excel file", () => {
  it("Good number of entry", (done) => {
    try {
      importData("./test/csv-files/molecules.xlsx"), { depth: null };
    } catch (e) {
      if (ImportationError.isInstance(e)) {
        console.error(`${e.name} : ${e.message}`);
        return;
      } else {
        throw e;
      }
    }
    done();
  }).timeout(5000);
});
