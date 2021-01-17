import mysql from "mysql";
import { parseCSV } from "./csv_parser/Parser.js";

const propertiesId = {
  side_effects: 1,
  interactions: 2,
  indications: 3,
  _get(property) {
    return propertiesId[property];
  },
};

/**
 * Parse a csv file and create the sql script to insert it in database
 * @param {string} filename
 */
export function parseAndImport(filename) {
  return new Promise((resolve, reject) => {
    parseCSV(filename)
      .then((json) => {
        resolve(insertAllData(JSON.parse(json)));
      })
      .catch(reject);
  });
}

/**
 * Create a script to insert parsed data in database
 * @param {object} data
 * @param {string}
 */
export function insertAllData(data) {
  let script = "";

  script += insertClassificationSql("class", data["classes"]);
  script += insertClassificationSql("system", data["systems"]);

  for (let property of ["side_effects", "indications", "interactions"]) {
    script += insertPropertySql(property, data[property]);
  }
  script += insertAllMolecules(data.molecules);

  return script;
}

/**
 * Create an sql insertion command (curryfied)
 * @param {string} table
 * @return {function(...string):function(...string):string}
 */
function insertInto(table) {
  let sql = `INSERT INTO ${table} `;
  return function columns(...columns) {
    if (columns.length) {
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
 */
function insertClassificationSql(name, classification) {
  let insertNodeAndChildren = createClassificationNodeInserter(name);
  return classification.reduce((sql, node) => sql + insertNodeAndChildren(node, null, 1), "");
}

/**
 * Create the function that creates the sql script to insert a node and its children
 * @param {string} classification
 */
function createClassificationNodeInserter(classification) {
  function insertNode(id, name, higher, level) {
    return insertInto(classification)()([id, name, higher, level]);
  }
  return function insertNodeAndChildren({ id, name, children }, higher, level) {
    return (
      insertNode(id, name, higher, level) +
      children.reduce((sql, node) => sql + insertNodeAndChildren(node, id, level + 1), "")
    );
  };
}

/**
 * Create the sql script to insert a property and its values
 * @param {{name : string, id : number}[]} property
 */
function insertPropertySql(name, property) {
  const id = propertiesId._get(name);
  let script = insertInto("property")("pr_id", "pr_name")(id, name);

  return property.reduce((sql, value) => {
    let valueId = newIdForPropertyValue(id, value.id);
    return sql + insertInto("property_value")("pv_id", "pv_name", "pv_property")(valueId, value.name, id);
  }, script);
}

/**
 * Create a unique id for a property values, from the id of the property and the id of the value
 * @param {number} propertyId
 * @param {number} valueId
 */
function newIdForPropertyValue(propertyId, valueId) {
  return Number(String(propertyId) + String(valueId));
}

/**
 * Create the sql script to insert all molecules in database
 * @param {object[]} molecules
 */
function insertAllMolecules(molecules) {
  return molecules.reduce((sql, molecule) => sql + insertMolecule(new FormattedMolecule(molecule)), "");
}

/**
 * Create the sql command to insert a molecule in database
 * @param {FormattedMolecule} molecule
 * @returns {string}
 */
function insertMolecule(molecule) {
  if (!FormattedMolecule.isInstance(molecule)) {
    throw Error("Molecule must be formatted to be inserted");
  }

  const columns = ["mo_id", "mo_dci", "mo_skeletal_formula", "mo_ntr", "mo_difficulty", "mo_system", "mo_class"];
  const values = ["id", "dci", "skeletal_formule", "ntr", "difficulty", "system", "class"].map((p) =>
    molecule.getValue(p)
  );

  return insertInto("molecule")(...columns)(...values) + insertMoleculeProperties(molecule);
}

/**
 * Create sql script to insert all referenced property values of a molecule
 * @param {FormattedMolecule} molecule
 * @param {string}
 */
function insertMoleculeProperties(molecule) {
  return Object.keys(molecule.properties).reduce((script, property) => {
    const insertIntoMoleculeProperty = insertInto("molecule_property")("mo_id", "pv_id");

    return (
      script +
      molecule.properties[property].reduce(
        (sql, value) =>
          sql + insertIntoMoleculeProperty(molecule.id, newIdForPropertyValue(propertiesId._get(property), value)),
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
