import assert from "assert";

import chai from "chai";
import equalInAnyOrder from "deep-equal-in-any-order";

import { queryPromise, connection } from "../db/database.js";

import { insertData, forceTruncateTables } from "./index.test.js";

const { expect } = chai;
chai.use(equalInAnyOrder);

describe("Create and delete table", function () {
  it("Create table", function (done) {
    let sql = "CREATE TABLE testBasicTable (number INT, string VARCHAR(255))";
    queryPromise(sql).then(() => done());
  });

  it("Insert into", function (done) {
    let sql =
      "INSERT INTO testBasicTable (number, string) VALUES (2, 'Viva el guacamole'), (-10, 'Y las tortillas')";
    queryPromise(sql).then(() => done());
  });

  it("Select from", function (done) {
    let sql = "SELECT * FROM testBasicTable";
    queryPromise(sql).then((result) => {
      assert.deepStrictEqual(JSON.parse(JSON.stringify(result)), [
        { number: 2, string: "Viva el guacamole" },
        { number: -10, string: "Y las tortillas" },
      ]);

      done();
    });
  });

  it("Drop table", function (done) {
    let sql = "DROP TABLE testBasicTable";
    queryPromise(sql).then(() => done());
  });
});

describe("Check the database structure", function () {
  let structure = [
    {
      name: "molecule",
      fields: [
        "mo_id",
        "mo_dci",
        "mo_difficulty",
        "mo_skeletal_formula",
        "mo_ntr",
        "mo_class",
        "mo_system",
        "mo_image",
      ],
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
      fields: ["us_login", "us_victories", "us_defeats", "us_avatar"],
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
                AND table_schema= '${connection.config.database}'`;

    queryPromise(sql).then((res) => {
      assert.strictEqual(res[0]["nbr"], structure.length, "Incorrect number of tables");
      done();
    });
  });

  for (let table of structure) {
    it(`Table '${table.name}' fields`, function (done) {
      let sql = `SELECT *
                  FROM INFORMATION_SCHEMA.COLUMNS
                  WHERE TABLE_NAME = '${table.name}'
                  AND table_schema= '${connection.config.database}'`;

      queryPromise(sql).then((res) => {
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
    forceTruncateTables(
      "molecule",
      "property",
      "property_value",
      "molecule_property",
      "class",
      "system"
    ).then(() => insertData("molecules.sql").then(() => done()));
  });

  it("GetClassesOf", async () => {
    let classes = (await queryPromise("CALL getClassesOf(?)", ["AMANTADINE"]))[0].map(
      (e) => e.cl_name
    );
    expect(classes).to.be.deep.equals(["INHIBITEUR DE FUSION"]);

    classes = (await queryPromise("CALL getClassesOf(?)", ["TENOFOVIR DISOPROXIL"]))[0].map(
      (e) => e.cl_name
    );
    expect(classes).to.be.deep.equals([
      "camion",
      "INTI (INHIBITEURS NUCLEOSIDIQUES TRANSCRIPTASE INVERSE)",
      "ANALOGUES NUCLEOSIDIQUES",
    ]);

    classes = (await queryPromise("CALL getClassesOf(?)", ["INVALID"]))[0];
    expect(classes).to.be.deep.equals([]);
  });

  it("GetSystemsOf", async () => {
    let systems = (await queryPromise("CALL getSystemsOf(?)", ["AMANTADINE"]))[0].map(
      (e) => e.sy_name
    );
    expect(systems).to.be.deep.equals(["ANTIVIRAL", "ANTIINFECTIEUX"]);

    systems = (await queryPromise("CALL getSystemsOf(?)", ["NEXISTPA"]))[0].map((e) => e.sy_name);
    expect(systems).to.be.deep.equals(["TRESNULLE", "ANTIRIEN"]);

    systems = (await queryPromise("CALL getSystemsOf(?)", ["INVALID"]))[0];
    expect(systems).to.be.deep.equals([]);
  });

  it("GetPropertyValuesOf", async () => {
    const indications = (
      await queryPromise("CALL getPropertyValuesOf(?,?)", ["AMANTADINE", "indications"])
    )[0].map((e) => e.value);
    expect(indications).to.be.deep.equalInAnyOrder(["Grippe", "Parkinson"]);

    const interactions = (
      await queryPromise("CALL getPropertyValuesOf(?,?)", ["LEVOFLOXACINE", "interactions"])
    )[0].map((e) => e.value);
    expect(interactions).to.be.deep.equalInAnyOrder(["Allongement QT"]);

    const sideEffects = (
      await queryPromise("CALL getPropertyValuesOf(?,?)", ["METHYLENECYCLINE", "sideEffects"])
    )[0].map((e) => e.value);
    expect(sideEffects).to.be.deep.equalInAnyOrder([
      "Décoloration dents",
      "Hypoplasie email dentaire",
      "oesophagite",
    ]);

    let invalid = (
      await queryPromise("CALL getPropertyValuesOf(?,?)", ["METHYLENECYCLINE", "colors"])
    )[0].map((e) => e.value);
    expect(invalid).to.be.deep.equalInAnyOrder([]);

    invalid = (
      await queryPromise("CALL getPropertyValuesOf(?,?)", ["ENOET", "sideEffects"])
    )[0].map((e) => e.value);
    expect(invalid).to.be.deep.equalInAnyOrder([]);
  });
});

describe("Procedures duels", () => {
  const duelIds = [];

  before("Clear duels, results & users", (done) => {
    forceTruncateTables("results", "duel", "user").then(() => insertData("users.sql").then(done));
  });

  it("Create a duel", async () => {
    let res = await queryPromise("CALL createDuel(?,?,?);", [
      "fpoguet",
      "nhoun",
      JSON.stringify(["questions"]),
    ]);
    expect(res[0][0]).to.haveOwnProperty("id");
    const firstID = res[0][0].id;
    res = await queryPromise("CALL createDuel(?,?,?);", [
      "fpoguet",
      "vperigno",
      JSON.stringify(["questions"]),
    ]);
    expect(res[0][0]).to.haveOwnProperty("id");
    expect(res[0][0].id).to.be.not.equals(firstID);
    duelIds.push(firstID, res[0][0].id);
  });

  it("Get a duel", async () => {
    const res = await queryPromise("CALL getDuel(?,?);", [duelIds[0], "fpoguet"]);
    const duel = res[0];
    expect(duel).has.length(2);
    expect(duel.find((p) => p.us_login === "fpoguet")).not.undefined;
    expect(duel.find((p) => p.us_login === "nhoun")).not.undefined;
    expect(duel.find((p) => p.us_login === "vperigno")).undefined;

    delete duel[0].us_login;
    delete duel[1].us_login;

    expect(duel[0]).to.be.deep.equals(duel[1]);
    expect(duel[0].du_currentRound).equals(1);
    expect(Boolean(duel[0].du_inProgress)).to.be.true;
  });

  it("Get a noexistent duel", async () => {
    const res = await queryPromise("CALL getDuel(?,?);", [-1, "fpoguet"]);
    expect(res[0]).to.have.length(0);
  });

  it("Get a duel of others players", async () => {
    const res = await queryPromise("CALL getDuel(?,?);", [duelIds[0], "vperigno"]);
    expect(res[0]).to.have.length(0);
  });

  it("Get a duel with invalid user", async () => {
    const res = await queryPromise("CALL getDuel(?,?);", [duelIds[0], "noexist"]);
    expect(res[0]).to.have.length(0);
  });

  it("Get all duels of a user", async () => {
    const res = await queryPromise("CALL getDuelsOf(?);", ["fpoguet"]);
    expect(res[0]).to.have.length(4);
    expect(res[0].map((e) => e.du_id)).deep.equalInAnyOrder([
      duelIds[0],
      duelIds[0],
      duelIds[1],
      duelIds[1],
    ]);
  });

  it("Get all duels of a user (bis)", async () => {
    const res = await queryPromise("CALL getDuelsOf(?);", ["nhoun"]);
    expect(res[0]).to.have.length(2);
    expect(res[0].map((e) => e.du_id)).deep.equalInAnyOrder([duelIds[0], duelIds[0]]);
  });

  it("Get all duels of an invalid user ", async () => {
    const res = await queryPromise("CALL getDuelsOf(?);", ["nobody"]);
    expect(res[0]).to.have.length(0);
  });
});

describe("Procedures users statistics", () => {
  before("Clear and insert users", (done) => {
    forceTruncateTables("user").then(() => insertData("users.sql").then(done));
  });

  it("Default values is 0", async () => {
    const res = await queryPromise("SELECT us_defeats, us_victories FROM user");

    res.forEach((user) => {
      expect(user.us_victories).equals(0);
      expect(user.us_defeats).equals(0);
    });
  });

  it("Increment victories", async () => {
    for (let i = 0; i < 5; ++i) {
      const res = await queryPromise(
        "CALL incrementUserVictories(?); SELECT us_victories FROM user WHERE us_login = ?",
        ["fpoguet", "fpoguet"]
      );
      expect(res[1][0].us_victories).equals(i + 1);
    }
  });

  it("Increment defeats", async () => {
    for (let i = 0; i < 5; ++i) {
      const res = await queryPromise(
        "CALL incrementUserDefeats(?); SELECT us_defeats FROM user WHERE us_login = ?",
        ["fpoguet", "fpoguet"]
      );
      expect(res[1][0].us_defeats).equals(i + 1);
    }
  });
});
