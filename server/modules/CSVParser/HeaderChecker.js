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
    this.errors = [
      ...checkNotEmptyHeader(this.header),
      ...checkMissingColumns(this.header, this.columnsSpecs),
      ...checkDuplicateUniqueColumns(this.header, this.columnsSpecs),
      ...checkInvalidColumns(this.header, this.columnsSpecs),
      ...checkColumnsGroups(this.header, this.columnsSpecs),
      ...checkHierarchicalColumnsOrder(this.header, this.columnsSpecs),
    ];

    return this.errors.length === 0;
  }

  /**
   * Returns the array of errors that occurred during checks
   * @return {HeaderError[]} errors
   */
  getErrors() {
    return this.errors;
  }
}

// TODO improve erros by adding code + french message
export class HeaderError extends Error {
  /**
   * Create an Error
   * @param {number} code The error code
   * @param {{title : string, index : number}} details Some details about where the error has occured
   */
  constructor(code, details) {
    super();
    this.name = "HeaderError";
    this.code = code;
    this.message = HeaderError.getMessage(code, details);
  }
  static isInstance(error) {
    return error instanceof HeaderError;
  }

  static getMessage(code, { index, title }) {
    const messages = Object.create(null);

    messages[HeaderError.EMPTY_FILE] = `L'en-tête du fichier est vide.`;

    messages[
      HeaderError.BAD_COLUMNS_GROUP
    ] = `Les colonnes d'une même propriété sont mal regroupées : '${title}' (col. ${index + 1})`;

    messages[HeaderError.DUPLICATE_UNIQUE_COLUMN] = `Duplication de la colonne unique '${title}' (col. ${index + 1})`;

    messages[HeaderError.MISSING_COLUMN] = `Colonne manquante : '${title}'`;

    messages[HeaderError.INVALID_COLUMN] = `Colonne invalide : '${title}' (col. ${index + 1})`;

    messages[
      HeaderError.BAD_HIERARCHICAL_COLUMNS_ORDER
    ] = `Niveau de hiérachisation non respecté : ${title} (col. ${index})`;
  }
}

HeaderError.MISSING_COLUMN = 1;
HeaderError.DUPLICATE_UNIQUE_COLUMN = 2;
HeaderError.EMPTY_FILE = 3;
HeaderError.INVALID_COLUMN = 4;
HeaderError.BAD_COLUMNS_GROUP = 5;
HeaderError.BAD_HIERARCHICAL_COLUMNS_ORDER = 6;

/// ***** INTERNAL FUNCTIONS *****

/**
 * Checks if the header is empty
 * @param {string[]} header
 */
function checkNotEmptyHeader(header) {
  if (header.length === 0) {
    return [new HeaderError(HeaderError.EMPTY_FILE)];
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
        errors.push(
          new HeaderError(HeaderError.BAD_COLUMNS_GROUP, {
            index,
            title,
          })
        );
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
      errors.push(new HeaderError(HeaderError.MISSING_COLUMN, { index, title: column }));
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
    if (!columnsSpecifications.some((column) => column.matchTitle(title))) {
      errors.push(
        new HeaderError(HeaderError.INVALID_COLUMN, {
          index,
          title,
        })
      );
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
  let uniqueColumnTitles = columnsSpecifications.filter((column) => column.isUnique()).map((column) => column.title);

  let checkedColumns = [];

  header.forEach((title, index) => {
    if (uniqueColumnTitles.includes(title)) {
      if (checkedColumns.includes(title)) {
        errors.push(new HeaderError(HeaderError.DUPLICATE_UNIQUE_COLUMN, { index, title }));
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
  let hierarchicalColumns = columnsSpecifications.filter((column) => column.isHierarchical());

  let currentGroup;
  let level;
  header.forEach((title, index) => {
    let group = hierarchicalColumns.find((column) => column.matchTitle(title));
    if (!group) {
      return;
    }
    group = group.title;
    if (currentGroup !== group) {
      currentGroup = group;
      level = 1;
    }

    let match = title.match(new RegExp(group));
    if (Number(match[1]) !== level) {
      errors.push(HeaderError.BAD_HIERARCHICAL_COLUMNS_ORDER, { title, index });
      level = null;
      return;
    }
    level++;
  });
  return errors;
}
