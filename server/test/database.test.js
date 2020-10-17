import db from "../db/database.js";
import assert from "assert";

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
