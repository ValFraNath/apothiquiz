import mysql from "mysql";
import { parseCSV } from "./csv_parser/Parser.js";

const properties = ["side_effects", "interactions", "indications"];

async function parserToSql(data) {
  data = JSON.parse(await parseCSV("../server/test/csv_parser/files/molecules.csv"));

  let script = "";

  script += insertClassificationSql("class", data["classes"]);
  script += insertClassificationSql("system", data["systems"]);

  for (let property of properties) {
    script += insertPropertySql(property, data[property]);
  }
  script += insertMoleculesSql(data.molecules);
  console.log(script);
}

function insertClassificationSql(name, classification) {
  let insertNodeAndChildren = insertIn(name);
  let sql = "";

  for (let node of classification) {
    sql += insertNodeAndChildren(node, null, 1);
  }

  return sql;
}

/**
 *
 * @param {string} classification
 */
function insertIn(classification) {
  function insertNodeSql(id, name, higher, level) {
    return mysql.format(`INSERT INTO ${classification} VALUES (?,?,?,?);\n`, [id, name, higher, level]);
  }
  return function insertNodeAndChildren({ id, name, children }, higher, level) {
    return (
      insertNodeSql(id, name, higher, level) + children.map((c) => insertNodeAndChildren(c, id, level + 1)).join("")
    );
  };
}

/**
 * Create the insertion script for a property
 * @param {{name : string, id : number}[]} property
 */
function insertPropertySql(name, property) {
  const id = properties.indexOf(name) + 1;

  let sql = `INSERT INTO property (pr_id, pr_name) VALUES (${id},"${name}");\n`;
  for (let value of property) {
    sql += `INSERT INTO property_value (pv_id, pv_name, pv_property) VALUES (${id}${value.id},'${value.name}',${id});\n `;
  }
  return sql;
}

/**
 *
 * @param {{
 *      id : number,
 *      dci : string,
 *      systems: number,
 *      classes : number,
 *      interactions : number[],
 *      indications : number[],
 *      ntr : number,
 *      level_easy : number,
 *      level_hard : number
 *    }[]} molecules
 */
function insertMoleculesSql(molecules) {
  let sql = "";

  molecules.forEach((molecule) => {
    sql += insertMoleculeSql(molecule);
    properties.forEach((property, index) => {
      molecule[property].forEach((value) => {
        sql += `INSERT INTO molecule_property (mo_id,pv_id) VALUES (${molecule.id},${index + 1}${value});\n`;
      });
    });
  });
  return sql;
}

function insertMoleculeSql({ dci, skeletal_formule, ntr, id, level_hard, systems, classes }) {
  skeletal_formule = skeletal_formule || "";
  let difficulty = level_hard ? "HARD" : "EASY";
  ntr = Number(ntr);
  return mysql.format(
    `INSERT INTO molecule (mo_id, mo_dci, mo_skeletal_formula, mo_ntr, mo_difficulty,mo_system,mo_class) \
          VALUES (?,?,?,?,?,?,?);\n`,
    [id, dci, skeletal_formule, ntr, difficulty, systems, classes]
  );
}

parserToSql();
