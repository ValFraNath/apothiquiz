import { readCSV } from "./Reader.js";

// eslint-disable-next-line no-unused-vars
import HeaderChecker, { HeaderErrors } from "./HeaderChecker.js";
import ParserSpecifications from "./ParserSpecifications.js";
import FileStructure from "./FileStructure.js";
import Classification from "./MoleculesClassification.js";
import Property from "./MoleculesProperty.js";
import MoleculeList from "./MoleculeList.js";

/**
 * Import CSV file to parse data into an object
 * @param {string} filepath The path to the file
 * @returns {Promise<Error|HeaderErrors|JSON>}
 */
export function parseCSV(filepath) {
  return new Promise((resolve, reject) => {
    readCSV(filepath)
      .then((matrix) => {
        let moleculesMatrix = cleanUpStringsInMatrix(matrix);

        const columnsHeader = moleculesMatrix.shift();

        const checker = new HeaderChecker(columnsHeader, ParserSpecifications.columns);
        if (!checker.check()) {
          reject(checker.getErrors());
          return;
        }

        const structure = new FileStructure(columnsHeader, ParserSpecifications.columns);

        moleculesMatrix = removeInvalidMoleculeLines(moleculesMatrix, structure.getIndexesFor("dci")[0]);

        const data = Object.create(null);

        const nonUniqueColumns = ParserSpecifications.columns.filter((column) => !column.isUnique());

        for (let column of nonUniqueColumns) {
          const creator = column.isHierarchical() ? Classification.create : Property.create;

          data[column.property] = creator(extractColumns(moleculesMatrix, ...structure.getIndexesFor(column.property)));
        }

        data.molecules = MoleculeList.create(moleculesMatrix, structure, data);

        //console.error(JSON.stringify(data));

        resolve(JSON.stringify(data));
      })
      .catch(reject);
  });
}

// ***** INTERNAL FUNCTIONS *****

/**
 * Returns the matrix without rows where the molecule dci is empty.
 * @param {[][]} matrix
 * @param {number} dciIndex The index of the dci column
 * @return {[][]}
 */
function removeInvalidMoleculeLines(matrix, dciIndex) {
  return matrix.filter((row) => row[dciIndex]);
}

/**
 * Trim and remove successive whitespaces in all strings of the matrix
 * @param {[][]} matrix
 * @returns {[][]}
 */
function cleanUpStringsInMatrix(matrix) {
  //console.log(matrix);
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
 * Extract columns from a matrix
 * @param {[][]} matrix
 * @param {number[]} indexes The indexes of columns we want to extract
 * @returns {[][]}
 */
function extractColumns(matrix, ...indexes) {
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

/**
 * Trim and remove successive white space in a string
 * @param {string} string
 * @returns {string}
 */
function removeSuccessiveWhiteSpaces(string = "") {
  return string.trim().replace(/\s+/g, " ");
}
