import ColumnSpecifications from "../csv_reader/ColumnSpecification.js";
import FileStructure from "../csv_reader/FileStructure.js";
import HeaderChecker from "../csv_reader/HeaderChecker.js";
import { readCSV } from "../csv_reader/reader.js";

import UsersList from "./UsersList.js";

const columnsSpecs = [
  new ColumnSpecifications("LOGIN", "login", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("ADMIN", "admin", ColumnSpecifications.UNIQUE),
];

/**
 * Import users list from a CSV file
 * @param {string} filepath The path to the file
 */
export async function parseUsersFromCsv(filepath) {
  const usersMatrix = await readCSV(filepath);
  const columnsHeader = usersMatrix.shift();

  const checker = new HeaderChecker(columnsHeader, columnsSpecs);
  if (!checker.check()) {
    throw checker.getErrors();
  }

  const structure = new FileStructure(columnsHeader, columnsSpecs);

  const cleanedUsersMatrix = removeInvalidUsersLines(
    usersMatrix,
    structure.getIndexesFor("login")[0]
  );

  const users = new UsersList(cleanedUsersMatrix, structure);

  return {
    toJSON: () => JSON.stringify(users.extract()),
    analyze: () => users.analyze(),
    importSql: () => users.importSql(),
  };
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
