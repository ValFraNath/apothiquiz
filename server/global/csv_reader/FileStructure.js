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
    this.propertiesIndexes = Object.create(null);
    this.columnsSpecs = columnsSpecs;

    forEachCorrespondingColumns(this, (column, index) => {
      addProperty(this, column.property, index);
    });
  }

  /**
   * Return the indexes corresponding to a property
   * @param {string} property The property name
   * @return {number[]} Indexes
   */
  getIndexesFor(property) {
    return (this.propertiesIndexes[property] || []).slice();
  }

  /**
   * @returns {ColumnSpecifications[]} The columns specifications
   */
  getColumnsSpecifications() {
    return this.columnsSpecs;
  }
}

// ***** INTERNAL FUNCTIONS *****

/**
 * Add a property to the structure
 * @param {FileStructure} structure The struture to which we add the property
 * @param {ColumnSpecifications} property
 * @param {number} index
 */
function addProperty(structure, property, index) {
  let currentIndexes = structure.propertiesIndexes[property];
  if (currentIndexes) {
    currentIndexes.push(index);
  } else {
    structure.propertiesIndexes[property] = [index];
  }
}

/**
 * Iterate through all the header columns and run a callback for each one corresponding to a column in specifications
 * @param {FileStructure} structure The structure to itearate
 * @param {function(ColumnSpecifications,number)} callback - Function to execute for each column corresponding to a property
 */
function forEachCorrespondingColumns(structure, callback) {
  structure.header.forEach((headerColumn, index) => {
    structure.columnsSpecs.forEach((columnSpecs) => {
      if (columnSpecs.matchTitle(headerColumn)) {
        callback(columnSpecs, index);
      }
    });
  });
}
