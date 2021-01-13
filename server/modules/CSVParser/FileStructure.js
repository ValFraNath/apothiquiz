// eslint-disable-next-line no-unused-vars
import { ColumnSpecifications } from "./ParserSpecifications.js";

/**
 * Class representing the structure of the CSV file, i.e. which columns correspond to which property.
 */
export default class FileStructure {
  /**
   * This function reads the first row and stores which index is associated with which property
   * @param {string[]} header The CSV file first row
   * @param {ColumnSpecifications[]} requiredColumns The columns we want to extract
   * @throws {ImportationError} if the spreadsheet is incorrectly formatted
   */
  constructor(header, requiredColumns) {
    this.header = header;
    this.propertiesIndexes = Object.create(null);
    this.requiredColumns = requiredColumns;

    this._forEachCorrespondingColumns((column, index) => {
      this._addProperty(column.property, index);
    });
  }

  /**
   * @param {string} property
   * @return {number[]} Indexes
   */
  getIndexesFor(property) {
    return (this.propertiesIndexes[property] || []).slice();
  }

  /**
   * Add a property to the structure
   * @param {ColumnSpecifications} property
   * @param {number} index
   * @param {number} level
   * @throws {ImportationError} if en error has occured during the importation
   */
  _addProperty(property, index) {
    let currentIndexes = this.propertiesIndexes[property];
    if (currentIndexes) {
      currentIndexes.push(index);
    } else {
      this.propertiesIndexes[property] = [index];
    }
  }

  /**
   * Iterate through all the header columns and run a callback for each one corresponding to a required column
   * @param {function(ColumnSpecifications,number,number|undefined)} callback - Function to execute for each column corresponding to a property
   */
  _forEachCorrespondingColumns(callback) {
    this.header.forEach((headerColumn, index) => {
      if (!headerColumn) {
        return;
      }

      this.requiredColumns.forEach((requiredColumn) => {
        if (new RegExp(requiredColumn.title).test(headerColumn)) {
          callback(requiredColumn, index);
        }
      });
    });
  }
}
