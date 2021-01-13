import xlsx from "node-xlsx";
import HeaderChecker from "./HeaderChecker.js";
import ParserSpecifications from "./ParserSpecifications.js";
import FileStructure from "./FileStructure.js";
import Classification from "./MoleculesClassification.js";
import Property from "./MoleculesProperty.js";
import MoleculeList from "./MoleculeList.js";

/**
 * Import CSV file to parse data into an object
 * @param {string} filepath
 * @return {JSON}
 */
export function importData(filepath) {
  let moleculesMatrix = cleanUpStringsInMatrix(readCsvFile(filepath));

  const columnsHeader = moleculesMatrix.shift();

  const checker = new HeaderChecker(
    columnsHeader,
    ParserSpecifications.columns
  );
  if (!checker.check()) {
    console.table(checker.getErrors());
    process.exit(1);
  }

  const structure = new FileStructure(
    columnsHeader,
    ParserSpecifications.columns
  );

  moleculesMatrix = removeInvalidMoleculeLines(
    moleculesMatrix,
    structure.getIndexesFor("dci")[0]
  );

  const data = Object.create(null);

  const nonUniqueColumns = ParserSpecifications.columns.filter(
    (column) => !column.isUnique()
  );

  for (let column of nonUniqueColumns) {
    const creator = column.isHierarchical()
      ? Classification.create
      : Property.create;

    data[column.property] = creator(
      extractColumns(
        moleculesMatrix,
        ...structure.getIndexesFor(column.property)
      )
    );
  }

  data.molecules = MoleculeList.create(moleculesMatrix, structure, data);

  //console.error(JSON.stringify(data));

  return JSON.stringify(data);
}

// ***** INTERNAL FUNCTIONS *****

/**
 *
 * @param {[][]} matrix
 */
function removeInvalidMoleculeLines(matrix, dciIndex) {
  return matrix.filter((row) => row[dciIndex]);
}

/**
 * Read the CSV file and parse it in a matrix
 * @param {string} filepath
 */
function readCsvFile(filepath) {
  return xlsx.parse(filepath)[0].data;
}

/**
 * Trim and remove successive whitespaces in all strings of the matrix
 * @param {any[][]} matrix
 */
function cleanUpStringsInMatrix(matrix) {
  return matrix.map((row) =>
    row.map((value) =>
      isString(value) ? removeSuccessiveWhiteSpaces(value) : value
    )
  );
}

function isString(variable) {
  return variable instanceof String || typeof variable === "string";
}

/**
 * Extract columns from a matrix
 * @param {array[]} matrix
 * @param {number} begin The first index
 * @param {number} end The last index (not include)
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
 */
function removeSuccessiveWhiteSpaces(string = "") {
  return string.trim().replace(/\s+/g, " ");
}
