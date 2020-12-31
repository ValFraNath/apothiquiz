import chai from "chai";
import chaiHttp from "chai-http";
chai.use(chaiHttp);

import { readCsvFile } from "../modules/data-importer.js";

describe("Good data importation from excel file", () => {
  it("Good number of entry", (done) => {
    readCsvFile("./test/csv-files/molecules_list.xlsx");
    done();
  }).timeout(5000);
});
