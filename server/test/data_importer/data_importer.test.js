import mocha from "mocha";
import chai from "chai";
import path from "path";

import { queryPromise } from "../../db/database.js";
import { forceTruncateTables } from "../index.test.js";
const { expect } = chai;
const { describe, it, before, after } = mocha;

import { parseAndImport } from "../../modules/data_importer/data_importer.js";

describe("Data are well imported in database", function () {
  before("Import data", function (done) {
    parseAndImport(path.resolve("test", "data_importer", "files", "molecules.csv")).then((script) => {
      queryPromise(script).then(() => done());
    });
  });

  it("Good number of entries", async () => {
    expect(await getNumberOfEntry("molecule")).equals(140);
    expect(await getNumberOfEntry("system")).equals(4);
    expect(await getNumberOfEntry("class")).equals(48);
    expect(await getNumberOfEntry("property")).equals(3);
  });

  after("Trucante table", (done) => {
    queryPromise(
      forceTruncateTables("molecule", "class", "system", "property", "property_value", "molecule_property")
    ).then(() => done());
  });
});

async function getNumberOfEntry(table) {
  let sql = `SELECT COUNT(*) as number_of_entry FROM ${table}`;
  const res = await queryPromise(sql);
  expect(res).has.length(1);
  return Number(res[0]["number_of_entry"]);
}
