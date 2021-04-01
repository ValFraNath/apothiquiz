// eslint-disable-next-line no-unused-vars
import { ColumnSpecifications } from "./ColumnSpecification.js";

/**
 * Class representing the structure of the CSV file, i.e. which column correspond to which property.
 */
export default class FileStructure {
  /**
   * This object reads the first row and stores which index is associated with which property.
   * @param {string[]} header The CSV file first row
   * @param {ColumnSpecifications[]} columnsSpecs The specifications of columns we want to extract
   */
  constructor(header, columnsSpecs) {
    this.header = header;
    this.propertiesIndexes = {};
    this.columnsSpecs = columnsSpecs;

    this._forEachCorrespondingColumns((column, index) => {
      this._addProperty(column.property, index);
    });
  }

  /**
   * Return the indexes corresponding to a property
   * @param {string} property The property name
   * @return {number[]} Indexes
   */
  getIndexesFor(property) {
    return (this.propertiesIndexes[property] || []).slice(); // slice to return a copy
  }

  /**
   * Add a property to the structure
   * @param {ColumnSpecifications} property
   * @param {number} index
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
   * Iterate through all the header columns and run a callback for each one corresponding to a column in specifications
   * @param {function(ColumnSpecifications,number)} callback - Function to execute for each column corresponding to a property
   */
  _forEachCorrespondingColumns(callback) {
    this.header.forEach((headerColumn, index) => {
      this.columnsSpecs.forEach((columnSpecs) => {
        if (columnSpecs.matchTitle(headerColumn)) {
          callback(columnSpecs, index);
        }
      });
    });
  }
}
