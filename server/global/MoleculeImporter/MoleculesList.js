import FileStructure from "../csv_reader/FileStructure.js";

import Classification from "./Classification.js";

import Property, { PropertyValue } from "./Property.js";

export default class MoleculeList {
  constructor(matrix, structure, data) {
    this.list = [];
    let autoIncrementId = 1;

    matrix.forEach((row) => this.list.push(new Molecule(autoIncrementId++, row, structure, data)));
  }

  extract() {
    return this.list.map((molecule) => molecule.extract());
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

    this.dci = this.getUniquePropertyValue("dci", row, structure);
    this.skeletalFormula = this.getUniquePropertyValue("skeletalFormula", row, structure);
    this.ntr = this.getUniquePropertyValue("ntr", row, structure);
    this.levelEasy = this.getUniquePropertyValue("levelEasy", row, structure);
    this.levelHard = this.getUniquePropertyValue("levelHard", row, structure);

    this.indications = this.getMultivaluedPropertyValuesIds("indications", row, structure, data);
    this.interactions = this.getMultivaluedPropertyValuesIds("interactions", row, structure, data);
    this.sideEffects = this.getMultivaluedPropertyValuesIds("sideEffects", row, structure, data);

    this.system = this.getClassificationNodeID("system", row, structure, data);
    this.class = this.getClassificationNodeID("class", row, structure, data);
  }

  /**
   * Get the value of a unique property
   * @param {string} property The property name
   * @param {any[]} row The complete row
   * @param {FileStructure} structure The file structure
   */
  getUniquePropertyValue(property, row, structure) {
    const value = row[structure.getIndexesFor(property)[0]];
    return value !== undefined ? value : null;
  }

  /**
   * Get the id of the values of a multi valued property
   * @param {string} property The property name
   * @param {any[]} row The complete row
   * @param {FileStructure} structure The file structure
   * @param {object} data  Object containing classifications & properties data
   */
  getMultivaluedPropertyValuesIds(property, row, structure, data) {
    const indexes = structure.getIndexesFor(property);
    const values = row.filter((_, index) => indexes.includes(index));
    return this.getPropertyValuesIds(data[property], values);
  }

  /**
   * Get the id of the classification value to which the molecule belongs
   * @param {string} classificationName The classification name
   * @param {any[]} row The complete row
   * @param {FileStructure} structure The file structure
   * @param {object} data  Object containing classifications & properties data
   */
  getClassificationNodeID(classificationName, row, structure, data) {
    /** @type {Classification} */
    const classification = data[classificationName];
    const indexes = structure.getIndexesFor(classificationName);
    const values = row.filter((_, index) => indexes.includes(index));

    // console.log("values", classificationName, values);

    let node = classification.getElementByName(values.shift());

    while (node && values.length > 0) {
      const child = node.getChildByName(values.shift());
      if (child) {
        node = child;
      }
    }
    return node?.id || null;
  }

  /**
   *
   * @param {Property} property
   * @param {PropertyValue[]} values
   * @returns
   */
  getPropertyValuesIds(property, values) {
    return values.filter((v) => v).map((value) => property.getValueByName(value).id);
  }

  extract() {
    return JSON.parse(JSON.stringify(this));
  }
}
