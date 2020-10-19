import db from "../db/database.js";
import assert from "assert";

before(function (done) {
  db.on("database_ready", done);
});

describe("Create and delete table", function () {
  it("Create table", function (done) {
    let sql = "CREATE TABLE testBasicTable (number INT, string VARCHAR(255))";
    db.query(sql, function (err) {
      if (err) throw err;
      done();
    });
  });

  it("Insert into", function (done) {
    let sql =
      "INSERT INTO testBasicTable (number, string) VALUES (2, 'Viva el guacamole'), (-10, 'Y las tortillas')";
    db.query(sql, function (err) {
      if (err) throw err;
      done();
    });
  });

  it("Select from", function (done) {
    let sql = "SELECT * FROM testBasicTable";
    db.query(sql, function (err, result) {
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
    db.query(sql, function (err) {
      if (err) throw err;
      done();
    });
  });
});

describe("Check the database structure", function () {
  let structure = [
    {
      name: "molecule",
      fields: [
        "mo_ID",
        "mo_name",
        "mo_dci",
        "mo_difficulty",
        "mo_skeletal_formula",
      ],
    },
    {
      name: "class",
      fields: ["cl_id", "cl_name"],
    },
    {
      name: "property",
      fields: ["pr_id", "pr_name"],
    },
    {
      name: "molecule_property",
      fields: ["pr_id", "mo_id"],
    },
    {
      name: "molecule_class",
      fields: ["cl_id", "mo_id"],
    },
  ];

  for (let table of structure) {
    it(`Table '${table.name}' fields`, function (done) {
      let sql = `SELECT *
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_NAME = '${table.name}'`;

      db.query(sql, function (err, res) {
        if (err) throw err;
        assert(res.length !== 0, `The table '${table.name}' doesn't exist. `);

        let fieldsToTest = res.map((e) => e["COLUMN_NAME"]);
        assert.strictEqual(
          fieldsToTest.length,
          table.fields.length,
          "Incorrect number of fields."
        );

        table.fields.forEach((field) => {
          assert(
            fieldsToTest.includes(field),
            `Incorrect field :  "${field}". `
          );
        });
        done();
      });
    });
  }
});
