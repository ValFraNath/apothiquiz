import reader from "csv-reader";
import fs from "fs";

export function readCSV(filepath) {
  return new Promise((resolve, reject) => {
    let inputStream = fs.createReadStream(filepath, "utf8").on("error", reject);

    const matrix = [];

    inputStream
      .pipe(new reader({ parseNumbers: true, parseBooleans: true, trim: true, delimiter: ";" }))
      .on("data", function (row) {
        matrix.push(row);
      })
      .on("end", function () {
        resolve(matrix);
      })
      .on("error", function (error) {
        reject(error);
      });
  });
}
