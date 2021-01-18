// eslint-disable-next-line no-unused-vars
import FileStructure from "./FileStructure.js";
import MoleculesProperty from "./MoleculesProperty.js";
import MoleculesClassification, {
  // eslint-disable-next-line no-unused-vars
  ClassificationNode,
} from "./MoleculesClassification.js";

/**
 * Create a list of molecules from a matrix of molecules and classifications/properties data
 * @param {[][]} matrix
 * @param {FileStructure} structure
 * @param {object} data Object containing classifications & properties data
 */
function create(matrix, structure, data) {
  const list = [];
  let id = 1;

  matrix.forEach((row) => list.push(createMolecule(id++, row, structure, data)));
  return list;
}

/**
 * Create a molecule
 * @param {number} id The unique id
 * @param {[]} row The complete row
 * @param {FileStructure} structure The file structure
 * @param {object} data  Object containing classifications & properties data
 */
function createMolecule(id, row, structure, data) {
  let molecule = Object.create(null);
  molecule.id = id++;

  structure.getColumnsSpecifications().forEach((column) => {
    const property = column.property;
    if (column.isUnique()) {
      const value = row[structure.getIndexesFor(property)];
      molecule[property] = value !== undefined ? value : null;
    }
    if (column.isMultiValued()) {
      const indexes = structure.getIndexesFor(property);
      molecule[property] = getMultiValuedPropertyIDs(row, indexes, data[property]);
    }
    if (column.isHierarchical()) {
      const indexes = structure.getIndexesFor(property);
      const id = getClassificationNodeID(row, indexes, data[property]);
      const propertyWithoutPlural = property.replace(/e?s$/, "");
      molecule[propertyWithoutPlural] = id !== undefined ? id : null;
    }
  });
  return molecule;
}

/**
 * Get the IDs of the property values of the molecule.
 * @param {string[]} row
 * @param {number[]} indexes
 * @param {{id : number,name : string}} property
 * @returns {number[]} The list of corresponding identifiers
 */
function getMultiValuedPropertyIDs(row, indexes, property) {
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
 * @returns {number} The corresponding ID
 */
function getClassificationNodeID(row, indexes, property) {
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
