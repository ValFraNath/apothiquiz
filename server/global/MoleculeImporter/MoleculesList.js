import FileStructure from "../csv_reader/FileStructure";

import Property, { PropertyValue } from "./Property.js";

export default class MoleculeList {
  constructor(matrix, structure, data) {
    this.list = [];
    let autoIncrementId = 1;

    matrix.forEach((row) => this.list.push(new Molecule(autoIncrementId++, row, structure, data)));
  }
}

export class Molecule {
  /**
   * Create a molecule
   * @param {number} id The unique id
   * @param {any[]} row The complete row
   * @param {FileStructure} structure The file structure
   * @param {object} data  Object containing classifications & properties data
   */
  constructor(id, row, structure, data) {
    this.id = id;
    const columnsSpecs = structure.getColumnsSpecifications();

    for (const column of columnsSpecs) {
      const { property } = column;

      if (column.isUnique()) {
        const value = row[structure.getIndexesFor(property)];
        this[property] = value !== undefined ? value : null;
      }

      if (column.isMultiValued()) {
        const indexes = structure.getIndexesFor(property);
        const values = row.filter((_, index) => indexes.includes(index));
        this[property] = this.getPropertyValuesIds(data[property], values);
      }

      if (column.isHierarchical()) {
        const indexes = structure.getIndexesFor(property);
        const values = row.filter((_, index) => indexes.includes(index));
        const id = this.getClassificationNodeID(data[property], values);
        this[property] = id !== undefined ? id : null;
      }
    }
  }

  getClassificationNodeID(classification, values) {}

  /**
   *
   * @param {Property} property
   * @param {PropertyValue[]} values
   * @returns
   */
  getPropertyValuesIds(property, values) {
    return values.map((value) => property.getValueByName(value).id);
  }
}
