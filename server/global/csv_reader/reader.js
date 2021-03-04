import fs from "fs";

import reader from "csv-reader";

/**
 * Read a csv file and return a matrix
 * @param {string} filepath The csv file path
 * @returns {Promise<string[][]}
 */
export async function readCSV(filepath) {
  return new Promise((resolve, reject) => {
    let inputStream = fs.createReadStream(filepath, "utf8").on("error", reject);
    const matrix = [];

    inputStream
      .pipe(new reader({ parseNumbers: true, parseBooleans: true, trim: true, delimiter: ";" }))
      .on("data", (row) => matrix.push(row))
      .on("end", () => resolve(cleanUpStringsInMatrix(matrix)))
      .on("error", (error) => reject(error));
  });
}

/**
 * Trim and remove successive whitespaces in all strings of the matrix
 * @param {[][]} matrix
 * @returns {[][]}
 */
function cleanUpStringsInMatrix(matrix) {
  return matrix.map((row) =>
    row.map((value) => {
      if (isString(value)) {
        value = removeSuccessiveWhiteSpaces(value);
        return value === "" ? null : value;
      }
      return value;
    })
  );
}

/**
 * Test if a variable is a string
 * @param {*} variable
 * @return {boolean}
 */
function isString(variable) {
  return variable instanceof String || typeof variable === "string";
}

/**
 * Trim and remove successive white space in a string
 * @param {string} string
 * @returns {string}
 */
function removeSuccessiveWhiteSpaces(string = "") {
  return string.trim().replace(/\s+/g, " ");
}

/**
 * Extract columns from a matrix
 * @param {[][]} matrix
 * @param {number[]} indexes The indexes of columns we want to extract
 * @returns {[][]}
 */
export function extractColumns(matrix, ...indexes) {
  const res = [];
  matrix.forEach((row) => {
    const newRow = [];

    row.forEach((value, index) => {
      if (value && indexes.includes(index)) {
        newRow.push(value);
      }
    });

    if (newRow.length) {
      res.push(newRow);
    }
  });
  return res;
}
