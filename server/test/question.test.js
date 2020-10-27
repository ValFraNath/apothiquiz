import app from "../index.js";
import assert from "assert";

import { generateQuestion } from "../api/question.js";
import { queryPromise } from "../db/database.js";
import fs from "fs";
import path from "path";
let __dirname = path.resolve();

before(function insertData(done) {
  app.waitReady(async function () {
    console.log("Insert data in database...");
    const data = fs
      .readFileSync(path.resolve(__dirname, "db", "insert_data.sql"))
      .toString("utf8");
    queryPromise(data)
      .then(() => {
        console.log("->Data inserted in database!");
        done();
      })
      .catch((err) => {
        throw err;
      });
  });
});

describe("Question generation", function () {
  it("Question type 1", function (done) {
    assert(true);
    generateQuestion(1);
    done();
  });
});
