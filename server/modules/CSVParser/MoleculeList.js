// eslint-disable-next-line no-unused-vars
import FileStructure from "./FileStructure.js";
import MoleculesProperty from "./MoleculesProperty.js";
// eslint-disable-next-line no-unused-vars
import MoleculesClassification, { ClassificationNode } from "./MoleculesClassification.js";

/**
 *
 * @param {[][]} matrix
 * @param {FileStructure} structure
 * @param {*} data
 */
function create(matrix, structure, data) {
  const list = [];
  let id = 1;

  matrix.forEach((row) => list.push(createMolecule(id++, row, structure, data)));
  return list;
}

/**
 *
 * @param {*} id
 * @param {*} row
 * @param {FileStructure} structure
 * @param {*} data
 */
function createMolecule(id, row, structure, data) {
  let molecule = Object.create(null);
  molecule.id = id++;

  structure.requiredColumns.forEach((column) => {
    const property = column.property;
    if (column.isUnique()) {
      molecule[property] = row[structure.getIndexesFor(property)];
    }
    if (column.isMultiValued()) {
      const indexes = structure.getIndexesFor(property);
      molecule[property] = getMultiValuedPropertyValues(row, indexes, data[property]);
    }
    if (column.isHierarchical()) {
      const indexes = structure.getIndexesFor(property);
      molecule[property] = getHierarchicalPropertyValue(row, indexes, data[property]);
    }
  });
  return molecule;
}

/**
 * Get the IDs of the property values of the molecule.
 * @param {string[]} row
 * @param {number[]} indexes
 * @param {{id : number,name : string}} property
 * @param {number[]}
 */
function getMultiValuedPropertyValues(row, indexes, property) {
  let values = [];
  indexes.forEach((index) => {
    let id = MoleculesProperty.findId(property, row[index]);
    if (id) {
      values.push(id);
    }
  });
  return values;
}

/**
 * Get the ID of the classification node to which the molecule belongs
 * @param {string[]} row
 * @param {number[]} indexes
 * @param {ClassificationNode[]} property
 * @param {number|null}
 */
function getHierarchicalPropertyValue(row, indexes, property) {
  let res = null;
  indexes.reverse().forEach((index) => {
    if (!row[index] || res) {
      return;
    }
    const id = MoleculesClassification.findId(property, row[index]);
    if (id) {
      res = id;
    }
  });
  return res;
}

export default { create };
