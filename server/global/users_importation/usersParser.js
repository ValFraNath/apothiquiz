import ColumnSpecifications from "../csv_reader/ColumnSpecification.js";
import FileStructure from "../csv_reader/FileStructure.js";
import HeaderChecker from "../csv_reader/HeaderChecker.js";
import { readCSV } from "../csv_reader/reader.js";

const columnsSpecs = [
  new ColumnSpecifications("LOGIN", "login", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("ADMIN", "admin", ColumnSpecifications.UNIQUE),
];

/**
 * Import users list from a CSV file
 * @param {string} filepath The path to the file
 * @returns {Promise<Error|HeaderErrors|JSON>} Either the JSON list or format errors
 */
export function parseUsersFromCsv(filepath) {
  return new Promise((resolve, reject) => {
    readCSV(filepath)
      .then((usersMatrix) => {
        const columnsHeader = usersMatrix.shift();

        const checker = new HeaderChecker(columnsHeader, columnsSpecs);
        if (!checker.check()) {
          reject(checker.getErrors());
          return;
        }

        const structure = new FileStructure(columnsHeader, columnsSpecs);
        usersMatrix = removeInvalidUsersLines(usersMatrix, structure.getIndexesFor("login")[0]);

        const users = [];

        for (const row of usersMatrix) {
          const login = row[structure.getIndexesFor("login")[0]];
          const admin = row[structure.getIndexesFor("admin")[0]];
          users.push({ login, admin });
        }

        resolve(JSON.stringify(users));
      })
      .catch(reject);
  });
}

/**
 * Returns the matrix without rows where the user login is empty.
 * @param {[][]} matrix The matrix of users
 * @param {number} loginIndex The index of the login column index
 * @return {[][]}
 */
function removeInvalidUsersLines(matrix, loginIndex) {
  return matrix.filter((row) => row[loginIndex]);
}
