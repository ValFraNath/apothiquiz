// eslint-disable-next-line no-unused-vars
import { ColumnSpecifications } from "./ParserSpecifications.js";

/**
 * Header Checker reads the header of the file and verifies it is formatted correctly
 */
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
    if (checkNotEmptyHeader(this.header).length) {
      this.errors = [{ code: HeaderErrors.EMPTY_FILE }];
      return false;
    }

    this.errors = [
      ...checkMissingColumns(this.header, this.columnsSpecs),
      ...checkDuplicateUniqueColumns(this.header, this.columnsSpecs),
      ...checkInvalidColumns(this.header, this.columnsSpecs),
      ...checkColumnsGroups(this.header, this.columnsSpecs),
      ...checkHierarchicalColumnsOrder(this.header, this.columnsSpecs),
    ];

    return this.errors.length === 0;
  }

  /**
   * Returns the object of errors that occurred during checks
   * @return {HeaderErrors} errors
   */
  getErrors() {
    return new HeaderErrors(this.errors);
  }
}

export class HeaderErrors extends Error {
  /**
   * Create an Error
   * @param {number} code The error code
   * @param {{code : number,title : string, index : number}[]} errors Some details about where the error has occured
   */
  constructor(errors) {
    super();
    this.name = "HeaderErrors";
    this.message = "Errors have occurred about the header structure";
    this.errors = errors.map((error) => {
      return {
        code: error.code,
        message: HeaderErrors.getMessage(error.code, { index: error.index, title: error.title }),
      };
    });
  }
  static isInstance(error) {
    return error instanceof HeaderErrors;
  }

  static getMessage(code, { index, title } = { index: null, title: null }) {
    index++;
    const messages = Object.create(null);

    messages[HeaderErrors.EMPTY_FILE] = `L'en-tête du fichier est vide.`;

    messages[
      HeaderErrors.BAD_COLUMNS_GROUP
    ] = `Les colonnes d'une même propriété sont mal regroupées : '${title}' (col. ${index})`;

    messages[HeaderErrors.DUPLICATE_UNIQUE_COLUMN] = `Duplication de la colonne unique '${title}' (col. ${index})`;

    messages[HeaderErrors.MISSING_COLUMN] = `Colonne manquante : '${title}'`;

    messages[HeaderErrors.INVALID_COLUMN] = `Colonne invalide : '${title}' (col. ${index})`;

    messages[
      HeaderErrors.BAD_HIERARCHICAL_COLUMNS_ORDER
    ] = `Niveaux de hiérachisation non respectés : ${title} (col. ${index})`;

    messages[HeaderErrors.EMPTY_COLUMN] = `Colonne vide (col. ${index}) `;

    return messages[code];
  }
}

HeaderErrors.MISSING_COLUMN = 1;
HeaderErrors.DUPLICATE_UNIQUE_COLUMN = 2;
HeaderErrors.EMPTY_FILE = 3;
HeaderErrors.INVALID_COLUMN = 4;
HeaderErrors.BAD_COLUMNS_GROUP = 5;
HeaderErrors.BAD_HIERARCHICAL_COLUMNS_ORDER = 6;
HeaderErrors.EMPTY_COLUMN = 7;

/// ***** INTERNAL FUNCTIONS *****

/**
 * Checks if the header is empty
 * @param {string[]} header
 */
function checkNotEmptyHeader(header) {
  if (!header.some((c) => c !== null)) {
    return [{ code: HeaderErrors.EMPTY_FILE }];
  }
  return [];
}

/**
 * Checks columns are well grouped
 * @param {string[]} header
 * @param {ColumnSpecifications[]} columnsSpecifications
 */
function checkColumnsGroups(header, columnsSpecifications) {
  const errors = [];
  const nonUniqueColumns = columnsSpecifications.filter((column) => !column.isUnique());

  const visitedGroups = [];
  let currentGroup;
  header.forEach((title, index) => {
    let group = nonUniqueColumns.find((column) => column.matchTitle(title));
    if (!group) {
      return;
    }
    if (group !== currentGroup) {
      visitedGroups.push(currentGroup);
      currentGroup = group;
      if (visitedGroups.includes(group)) {
        errors.push({ code: HeaderErrors.BAD_COLUMNS_GROUP, index, title });
      }
    }
  });
  return errors;
}

/**
 * Checks no columns are missing
 * @param {string[]} header
 * @param {ColumnSpecifications[]} columnsSpecifications
 */
function checkMissingColumns(header, columnsSpecifications) {
  const errors = [];
  columnsSpecifications.forEach((column, index) => {
    if (!header.some((title) => column.matchTitle(title))) {
      errors.push({ code: HeaderErrors.MISSING_COLUMN, index, title: column.title });
    }
  });
  return errors;
}

/**
 * Checks no columns are invalid
 * @param {string[]} header
 * @param {ColumnSpecifications[]} columnsSpecifications
 */
function checkInvalidColumns(header, columnsSpecifications) {
  const errors = [];
  header.forEach((title, index) => {
    if (title === null) {
      errors.push({ code: HeaderErrors.EMPTY_COLUMN, index });
      return;
    }
    if (!columnsSpecifications.some((column) => column.matchTitle(title))) {
      errors.push({ code: HeaderErrors.INVALID_COLUMN, index, title });
    }
  });
  return errors;
}

/**
 * Checks if multiple columns have the same unique property
 * @param {string[]} header
 * @param {ColumnSpecifications[]} columnsSpecifications
 */
function checkDuplicateUniqueColumns(header, columnsSpecifications) {
  const errors = [];
  const uniqueColumnTitles = columnsSpecifications.filter((column) => column.isUnique()).map((column) => column.title);

  let checkedColumns = [];

  header.forEach((title, index) => {
    if (uniqueColumnTitles.includes(title)) {
      if (checkedColumns.includes(title)) {
        errors.push({ code: HeaderErrors.DUPLICATE_UNIQUE_COLUMN, index, title });
      } else {
        checkedColumns.push(title);
      }
    }
  });
  return errors;
}

/**
 * Checks whether columns of the same hierarchical
 * property appear in hierarchy level order.
 * @param {string[]} header
 * @param {ColumnSpecifications[]} columnsSpecifications
 */
function checkHierarchicalColumnsOrder(header, columnsSpecifications) {
  const errors = [];
  const hierarchicalColumns = columnsSpecifications.filter((column) => column.isHierarchical());

  let currentGroupTitle;
  let expectedLevel;
  header.forEach((title, index) => {
    let group = hierarchicalColumns.find((column) => column.matchTitle(title));
    if (!group) {
      return;
    }

    if (currentGroupTitle !== group.title) {
      currentGroupTitle = group.title;
      expectedLevel = 1;
    }

    let level = group.getHierarchicalLevel(title);

    if (level !== expectedLevel) {
      if (expectedLevel !== null) {
        errors.push({ code: HeaderErrors.BAD_HIERARCHICAL_COLUMNS_ORDER, title, index });
      }
      expectedLevel = null;
      return;
    }
    expectedLevel++;
  });
  return errors;
}
