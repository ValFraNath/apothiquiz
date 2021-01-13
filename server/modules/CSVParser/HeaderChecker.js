// eslint-disable-next-line no-unused-vars
import { ColumnSpecifications } from "./ParserSpecifications.js";

export default class HeaderChecker {
  /**
   * Initialize the checker with the header, and the columns specifications
   * @param {string[]} header
   * @param {ColumnSpecifications[]} columnsSpecifications
   */
  constructor(header, columnsSpecifications) {
    this.header = header;
    this.columnsSpecs = columnsSpecifications;
    this.errors = [];
  }

  /**
   * Check if the header is corresponding to the specifications.
   * @return {boolean} True if the tests passed without problems, false otherwise.
   */
  check() {
    this.errors = [
      ...checkMissingColumns(this.header, this.columnsSpecs),
      ...checkDuplicateUniqueColumns(this.header, this.columnsSpecs),
      ...checkInvalidColumns(this.header, this.columnsSpecs),
      ...checkColumnsGroups(this.header, this.columnsSpecs),
      ...checkHierarchicalColumnsOrder(this.header, this.columnsSpecs),
    ];

    return Boolean(this.errors.length === 0);
  }

  /**
   * Returns the array of importation errors
   * @return {ImportationError[]} errors
   */
  getErrors() {
    return this.errors;
  }
}

// TODO improve erros by adding code + french message
export class ImportationError extends Error {
  constructor(message, code) {
    super();
    this.message = message;
    this.code = code;
    this.name = "FileFormatError";
  }
  static isInstance(error) {
    return error instanceof ImportationError;
  }
}
ImportationError.MISSING_COLUMN = 1;
ImportationError.DUPLICATE_UNIQUE_COLUMN = 2;
ImportationError.EMPTY_FILE = 3;
ImportationError.INVALID_COLUMN = 4;

/// ***** INTERNAL FUNCTIONS *****

/**
 * Checks if all columns of the same property are grouped together
 */
function checkColumnsGroups(header, columnsSpecifications) {
  const errors = [];
  const nonUniqueColumnsTitles = columnsSpecifications
    .filter((column) => !column.isUnique())
    .map((column) => column.title);

  const visitedGroups = [];
  let currentGroup;
  header.forEach((headerColumn) => {
    let group = nonUniqueColumnsTitles.find((title) => new RegExp(title).test(headerColumn));
    if (!group) {
      return;
    }
    if (group !== currentGroup) {
      visitedGroups.push(currentGroup);
      currentGroup = group;
      if (visitedGroups.includes(group)) {
        errors.push(new ImportationError("Colonnes " + headerColumn + " non regroupés"));
      }
    }
  });
  return errors;
}

/**
 * Checks columns are missing
 */
function checkMissingColumns(header, columnsSpecifications) {
  const errors = [];
  columnsSpecifications.forEach((column) => {
    if (!header.some((headerColumn) => new RegExp(column.title).test(headerColumn))) {
      errors.push(
        new ImportationError("Colonne manquante : " + column.title, ImportationError.MISSING_COLUMN)
      );
    }
  });
  return errors;
}

/**
 * Checks if there are invalid columns
 */
function checkInvalidColumns(header, columnsSpecifications) {
  const errors = [];
  header.forEach((headerColumn) => {
    if (!columnsSpecifications.some((column) => new RegExp(column.title).test(headerColumn))) {
      errors.push(
        new ImportationError("Invalide colonne : " + headerColumn, ImportationError.INVALID_COLUMN)
      );
    }
  });
  return errors;
}

/**
 * Checks if multiple columns have the same unique property
 */
function checkDuplicateUniqueColumns(header, columnsSpecifications) {
  const errors = [];
  let uniqueColumnTitles = columnsSpecifications
    .filter((column) => column.isUnique())
    .map((column) => column.title);

  let checkedColumns = [];

  header.forEach((column) => {
    if (uniqueColumnTitles.includes(column)) {
      if (checkedColumns.includes(column)) {
        errors.push(
          new ImportationError(
            "Colonne en double : " + column,
            ImportationError.DUPLICATE_UNIQUE_COLUMN
          )
        );
      } else {
        checkedColumns.push(column);
      }
    }
  });
  return errors;
}

/**
 * Checks whether columns of the same hierarchical property appear in hierarchy level order
 */
function checkHierarchicalColumnsOrder(header, columnsSpecifications) {
  const errors = [];
  let hierarchicalColumnTitles = columnsSpecifications
    .filter((column) => column.isHierarchical())
    .map((column) => column.title);

  let currentGroup;
  let level;
  header.forEach((headerColumn) => {
    let group = hierarchicalColumnTitles.find((title) => new RegExp(title).test(headerColumn));
    if (!group) {
      return;
    }
    if (currentGroup !== group) {
      currentGroup = group;
      level = 1;
    }

    let match = headerColumn.match(new RegExp(group));
    if (Number(match[1]) !== level) {
      errors.push(new ImportationError("Niveau de hiérachisation non respecté : " + headerColumn));
      level = null;
      return;
    }
    level++;
  });
  return errors;
}
