let header;
let requiredColumns;
let errors;
let initialized = false;

/// ***** EXPORTED FUNCTIONS *****

/**
 * Initialize the checker with the header, and the columns specifications
 * @param {string[]} header
 * @param {{title : string, property : PropertySpecifications}[]} requiredColumns
 */
function init(_header, _requiredColumns) {
  header = _header;
  requiredColumns = _requiredColumns;
  errors = [];
  initialized = true;
}

/**
 * Check if the header is corresponding to the specifications.
 * @return {boolean} True if the tests passed without problems, false otherwise.
 */
function check() {
  assertInitializedChecker();
  _checkMissingColumns();
  _checkDuplicateUniqueColumns();
  _checkInvalidColumns();
  _checkColumnsGroups();
  _checkHierarchicalColumnsOrder();

  return Boolean(errors.length === 0);
}

/**
 * Returns the array of importation errors
 * @return {ImportationError[]} errors
 */
function getErrors() {
  assertInitializedChecker();
  return errors;
}

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

export default { init, check, getErrors };

/// ***** INTERNAL FUNCTIONS *****

/**
 * Throw an error if the checker is not initialized
 */
function assertInitializedChecker() {
  if (!initialized) {
    throw new Error("Uninitialized checker.");
  }
}

/**
 * Checks if all columns of the same property are grouped together
 */
function _checkColumnsGroups() {
  const nonUniqueColumnsTitles = requiredColumns
    .filter((column) => !column.property.isUnique())
    .map((column) => column.title);

  console.log(nonUniqueColumnsTitles);
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
}

/**
 * Checks columns are missing
 */
function _checkMissingColumns() {
  requiredColumns.forEach((column) => {
    if (!header.some((headerColumn) => new RegExp(column.title).test(headerColumn))) {
      errors.push(
        new ImportationError("Colonne manquante : " + column.title, ImportationError.MISSING_COLUMN)
      );
    }
  });
}

/**
 * Checks if there are invalid columns
 */
function _checkInvalidColumns() {
  header.forEach((headerColumn) => {
    if (!requiredColumns.some((column) => new RegExp(column.title).test(headerColumn))) {
      errors.push(
        new ImportationError("Invalide colonne : " + headerColumn, ImportationError.INVALID_COLUMN)
      );
    }
  });
}

/**
 * Checks if multiple columns have the same unique property
 */
function _checkDuplicateUniqueColumns() {
  let uniqueColumnTitles = requiredColumns
    .filter((column) => column.property.isUnique())
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
}

/**
 * Checks whether columns of the same hierarchical property appear in hierarchy level order
 */
function _checkHierarchicalColumnsOrder() {
  let hierarchicalColumnTitles = requiredColumns
    .filter((column) => column.property.isHierarchical())
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
}
