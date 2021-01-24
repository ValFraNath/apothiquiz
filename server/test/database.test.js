import chai from "chai";

import assert from "assert";
import db, { queryPromise } from "../db/database.js";
import { insertData, forceTruncateTables } from "./index.test.js";

const { expect } = chai;

describe("Create and delete table", function () {
  it("Create table", function (done) {
    let sql = "CREATE TABLE testBasicTable (number INT, string VARCHAR(255))";
    db.connection.query(sql, function (err) {
      if (err) throw err;
      done();
    });
  });

  it("Insert into", function (done) {
    let sql = "INSERT INTO testBasicTable (number, string) VALUES (2, 'Viva el guacamole'), (-10, 'Y las tortillas')";
    db.connection.query(sql, function (err) {
      if (err) throw err;
      done();
    });
  });

  it("Select from", function (done) {
    let sql = "SELECT * FROM testBasicTable";
    db.connection.query(sql, function (err, result) {
      if (err) throw err;

      assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), [
        { number: 2, string: "Viva el guacamole" },
        { number: -10, string: "Y las tortillas" },
      ]);

      done();
    });
  });

  it("Drop table", function (done) {
    let sql = "DROP TABLE testBasicTable";
    db.connection.query(sql, function (err) {
      if (err) throw err;
      done();
    });
  });
});

describe("Check the database structure", function () {
  let structure = [
    {
      name: "molecule",
      fields: ["mo_id", "mo_dci", "mo_difficulty", "mo_skeletal_formula", "mo_ntr", "mo_class", "mo_system"],
    },
    {
      name: "property_value",
      fields: ["pv_id", "pv_name", "pv_property"],
    },
    {
      name: "molecule_property",
      fields: ["pv_id", "mo_id"],
    },
    {
      name: "server_informations",
      fields: ["key", "value"],
    },
    {
      name: "user",
      fields: ["us_login", "us_wins", "us_losts", "us_avatar"],
    },
    {
      name: "duel",
      fields: ["du_id", "du_content", "du_currentRound", "du_inProgress"],
    },
    {
      name: "results",
      fields: ["us_login", "du_id", "re_answers"],
    },
    {
      name: "property",
      fields: ["pr_id", "pr_name"],
    },
    {
      name: "system",
      fields: ["sy_id", "sy_name", "sy_higher", "sy_level"],
    },
    {
      name: "class",
      fields: ["cl_id", "cl_name", "cl_higher", "cl_level"],
    },
  ];

  it("Number of table", function (done) {
    let sql = `SELECT COUNT(table_name) as nbr
                FROM information_schema.tables 
                WHERE table_type = 'base table'
                AND table_schema= '${db.connection.config.database}'`;

    db.connection.query(sql, function (err, res) {
      if (err) throw err;
      assert.strictEqual(res[0]["nbr"], structure.length, "Incorrect number of tables");
      done();
    });
  });

  for (let table of structure) {
    it(`Table '${table.name}' fields`, function (done) {
      let sql = `SELECT *
                  FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_NAME = '${table.name}'
                  AND table_schema= '${db.connection.config.database}'`;

      db.connection.query(sql, function (err, res) {
        if (err) throw err;
        assert(res.length !== 0, `The table '${table.name}' doesn't exist. `);

        let fieldsToTest = res.map((e) => e["COLUMN_NAME"]);
        assert.strictEqual(fieldsToTest.length, table.fields.length, "Incorrect number of fields.");

        table.fields.forEach((field) => {
          assert(fieldsToTest.includes(field), `Incorrect field :  "${field}". `);
        });
        done();
      });
    });
  }
});

describe("Procedures Molecule data", () => {
  before("Insert data", (done) => {
    forceTruncateTables("molecule", "property", "property_value", "molecule_property", "class", "system").then(() =>
      insertData("molecules.sql").then(() => done())
    );
  });

  it("GetClassesOf", async () => {
    let classes = (await queryPromise("CALL getClassesOf(?)", ["AMANTADINE"]))[0].map((e) => e.cl_name);
    expect(classes).to.be.deep.equals(["INHIBITEUR DE FUSION"]);

    classes = (await queryPromise("CALL getClassesOf(?)", ["TENOFOVIR DISOPROXIL"]))[0].map((e) => e.cl_name);
    expect(classes).to.be.deep.equals([
      "camion",
      "INTI (INHIBITEURS NUCLEOSIDIQUES TRANSCRIPTASE INVERSE)",
      "ANALOGUES NUCLEOSIDIQUES",
    ]);

    classes = (await queryPromise("CALL getClassesOf(?)", ["INVALID"]))[0];
    expect(classes).to.be.deep.equals([]);
  });

  it("GetSystemsOf", async () => {
    let systems = (await queryPromise("CALL getSystemsOf(?)", ["AMANTADINE"]))[0].map((e) => e.sy_name);
    expect(systems).to.be.deep.equals(["ANTIVIRAL", "ANTIINFECTIEUX"]);

    systems = (await queryPromise("CALL getSystemsOf(?)", ["NEXISTPA"]))[0].map((e) => e.sy_name);
    expect(systems).to.be.deep.equals(["TRESNULLE", "ANTIRIEN"]);

    systems = (await queryPromise("CALL getSystemsOf(?)", ["INVALID"]))[0];
    expect(systems).to.be.deep.equals([]);
  });

  it("GetPropertyValuesOf", async () => {
    const indications = (await queryPromise("CALL getPropertyValuesOf(?,?)", ["AMANTADINE", "indications"]))[0].map(
      (e) => e.value
    );
    expect(indications).to.be.deep.equalInAnyOrder(["Grippe", "Parkinson"]);

    const interactions = (
      await queryPromise("CALL getPropertyValuesOf(?,?)", ["LEVOFLOXACINE", "interactions"])
    )[0].map((e) => e.value);
    expect(interactions).to.be.deep.equalInAnyOrder(["Allongement QT"]);

    const side_effects = (
      await queryPromise("CALL getPropertyValuesOf(?,?)", ["METHYLENECYCLINE", "side_effects"])
    )[0].map((e) => e.value);
    expect(side_effects).to.be.deep.equalInAnyOrder(["Décoloration dents", "Hypoplasie email dentaire", "oesophagite"]);

    let invalid = (await queryPromise("CALL getPropertyValuesOf(?,?)", ["METHYLENECYCLINE", "colors"]))[0].map(
      (e) => e.value
    );
    expect(invalid).to.be.deep.equalInAnyOrder([]);

    invalid = (await queryPromise("CALL getPropertyValuesOf(?,?)", ["ENOET", "side_effects"]))[0].map((e) => e.value);
    expect(invalid).to.be.deep.equalInAnyOrder([]);
  });
});

describe("Procedure duels", () => {
  before("Clear duels and results", (done) => {
    forceTruncateTables("results", "duel", "user").then(() => insertData("users.sql").then(done));
  });

  it("Create a duel", async () => {
    const res = await queryPromise("CALL createDuel(?,?,?);", ["fpoguet", "nhoun", JSON.stringify(["questions"])]);
    console.log(res);
  });
});
