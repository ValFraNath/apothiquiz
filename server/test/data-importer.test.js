import chai from "chai";
import chaiHttp from "chai-http";
chai.use(chaiHttp);

import { importData } from "../modules/data-importer.js";

describe("Good data importation from excel file", () => {
  it("Good number of entry", (done) => {
    importData("./test/csv-files/molecules.xlsx"), { depth: null };
    done();
  }).timeout(5000);
});
