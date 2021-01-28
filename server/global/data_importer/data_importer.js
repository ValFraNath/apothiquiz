import mysql from "mysql";
import { logError } from "../ErrorManager.js";
import { parseCSV } from "./csv_parser/Parser.js";

const propertiesId = {
  side_effects: 1,
  interactions: 2,
  indications: 3,
};

/**
 * Parse a csv file and create the sql script to insert it in database
 * @param {string} filename The csv file to parse
 * @returns {string} The sql script
 */
export function parseAndCreateSqlToInsertAllData(filename) {
  return new Promise((resolve, reject) => {
    parseCSV(filename)
      .then((json) => {
        resolve(createSqlToInsertAllData(JSON.parse(json)));
      })
      .catch(reject);
  });
}

/**
 * Create a script to insert parsed data in database
 * @param {object} data The parsed data
 * @returns {string} The sql script
 */
export function createSqlToInsertAllData(data) {
  let script = "";

  script += createSqlToInsertClassification("class", data["classes"]);
  script += createSqlToInsertClassification("system", data["systems"]);

  for (let property of ["side_effects", "indications", "interactions"]) {
    script += createSqlToInsertProperty(property, data[property]);
  }
  script += createSqlToInsertAllMolecules(data.molecules);
  return script;
}

/**
 * Create an sql insertion command (curryfied)
 * @param {string} table The table name
 * @returns {function(...string):function(...string):string}
 */
function createSqlToInsertInto(table) {
  let sql = `INSERT INTO ${table} `;
  return function columns(...columns) {
    if (columns.length > 0) {
      sql += `(${columns.join(", ")}) `;
    }
    return function values(...values) {
      return sql + `VALUES (${values.map(mysql.escape).join(", ")});\n`;
    };
  };
}

/**
 * Create the script to insert all values of classification
 * @param {string} name The classification table
 * @param {object[]} classification The list of higher nodes
 * @returns {string}
 */
function createSqlToInsertClassification(name, classification) {
  const insertNodeAndChildren = createClassificationNodeInserter(name);
  return classification.reduce((sql, node) => sql + insertNodeAndChildren(node, null, 1), "");
}

/**
 * Create the function that creates the sql script to insert a node and its children
 * @param {string} classification
 * @returns {function({id : number, name : string, children : object[]}, higher : number, level : number) : string}
 */
function createClassificationNodeInserter(classification) {
  function insertNode(id, name, higher, level) {
    return createSqlToInsertInto(classification)()([id, name, higher, level]);
  }

  return function createSqlToInsertNodeAndChildren({ id, name, children }, higher, level) {
    return (
      insertNode(id, name, higher, level) +
      children.reduce(
        (sql, node) => sql + createSqlToInsertNodeAndChildren(node, id, level + 1),
        ""
      )
    );
  };
}

/**
 * Create the sql script to insert a property and its values
 * @param {string} name The property name
 * @param {{name : string, id : number}[]} values The property values
 * @returns {string}
 */
function createSqlToInsertProperty(name, values) {
  const id = propertiesId[name];
  let script = createSqlToInsertInto("property")("pr_id", "pr_name")(id, name);

  return values.reduce((sql, value) => {
    const valueId = newIdForPropertyValue(id, value.id);
    return (
      sql +
      createSqlToInsertInto("property_value")("pv_id", "pv_name", "pv_property")(
        valueId,
        value.name,
        id
      )
    );
  }, script);
}

/**
 * Create a unique id for a property values, from the id of the property and the id of the value
 * @param {number} propertyId
 * @param {number} valueId
 * @returns {number}
 */
function newIdForPropertyValue(propertyId, valueId) {
  return Number(String(propertyId) + String(valueId));
}

/**
 * Create the sql script to insert all molecules in database
 * @param {object[]} molecules
 * @returns {string}
 */
function createSqlToInsertAllMolecules(molecules) {
  return molecules.reduce(
    (sql, molecule) => sql + createSqlToInsertMolecule(new FormattedMolecule(molecule)),
    ""
  );
}

/**
 * Create the sql command to insert a molecule in database
 * @param {FormattedMolecule} molecule
 * @returns {string}
 */
function createSqlToInsertMolecule(molecule) {
  if (!FormattedMolecule.isInstance(molecule)) {
    logError(new Error("Molecule must be formatted to be inserted"));
  }

  const columns = [
    "mo_id",
    "mo_dci",
    "mo_skeletal_formula",
    "mo_ntr",
    "mo_difficulty",
    "mo_system",
    "mo_class",
  ];
  const values = [
    "id",
    "dci",
    "skeletal_formule",
    "ntr",
    "difficulty",
    "system",
    "class",
  ].map((p) => molecule.getValue(p));

  return (
    createSqlToInsertInto("molecule")(...columns)(...values) +
    createSqlToInsertMoleculeProperties(molecule)
  );
}

/**
 * Create sql script to insert all referenced property values of a molecule
 * @param {FormattedMolecule} molecule
 * @returns {string}
 */
function createSqlToInsertMoleculeProperties(molecule) {
  return Object.keys(molecule.properties).reduce((script, property) => {
    const insertIntoMoleculeProperty = createSqlToInsertInto("molecule_property")("mo_id", "pv_id");

    return (
      script +
      molecule.properties[property].reduce(
        (sql, value) =>
          sql +
          insertIntoMoleculeProperty(
            molecule.id,
            newIdForPropertyValue(propertiesId[property], value)
          ),
        ""
      )
    );
  }, "");
}

/**
 * Class representing a formatted molecule, ready to be inserted into the database
 */
class FormattedMolecule {
  /**
   * Format a given molecule
   * @param {object} molecule
   */
  constructor(molecule) {
    this.id = Number(molecule.id);
    this.dci = molecule.dci;
    this.ntr = Number(molecule.ntr);
    this.system = molecule.system;
    this.class = molecule.class;
    this.skeletal_formule = String(molecule.skeletal_formule || "");
    this.difficulty = molecule.level_easy ? "EASY" : "HARD";
    this.properties = Object.create(null);
    this.properties.indications = molecule.indications.slice();
    this.properties.side_effects = molecule.side_effects.slice();
    this.properties.interactions = molecule.interactions.slice();
  }

  /**
   * Get the value for a property
   * @param {string} property
   */
  getValue(property) {
    return this[property];
  }

  /**
   * Check if an object is an instance of FormattedMolecule
   * @param {*} o
   */
  static isInstance(o) {
    return o instanceof FormattedMolecule;
  }
}
