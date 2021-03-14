import path from "path";

import chai from "chai";
import deepEqualAnyOrder from "deep-equal-in-any-order";
import mocha from "mocha";

const { expect } = chai;
const { describe, it, before } = mocha;
chai.use(deepEqualAnyOrder);

import { queryPromise } from "../../../db/database.js";

import { parseMoleculesFromCsv } from "../../../global/molecules_importation/moleculesParser.js";
import { forceTruncateTables } from "../../index.test.js";

import { expectations } from "./expectations.js";

const files = [
  {
    name: "molecules.csv",
    expectation: expectations.molecules,
  },
];

for (let file of files) {
  describe("Data are well imported in database", function () {
    before("Import data", async function () {
      this.timeout(10000);
      await forceTruncateTables(
        "molecule",
        "property",
        "property_value",
        "molecule_property",
        "class",
        "system"
      );
      const script = (
        await parseMoleculesFromCsv(
          path.resolve("test", "molecules_importation", "importer", "files", file.name)
        )
      ).importSql();
      await queryPromise(script);
    });

    it("Good number of molecule", async () => {
      let numberOfMolecules = await getNumberOfEntry("molecule");
      expect(numberOfMolecules).equals(file.expectation.numberOfMolecules);
    });

    for (let property of ["sideEffects", "interactions", "indications"]) {
      it("Property " + property, async () => {
        let values = await getPropertyValuesList(property);
        expect(values).deep.equalInAnyOrder(file.expectation[property]);
        expect(values).length(file.expectation[property].length);
      });
    }

    for (let classification of ["systems", "classes"]) {
      it("Classification " + classification, async () => {
        const values = await getClassification(classification);
        const names = values.map((value) => value.name);
        expect(names).deep.equalInAnyOrder(file.expectation[classification].all);

        file.expectation[classification].nodes.forEach((expNode) => {
          let node = values.find((value) => value.name === expNode.name);
          expect(node.parents).deep.equals(expNode.parents);
        });
      });
    }

    for (let expMolecule of file.expectation.molecules) {
      it(`Good molecule data : ${expMolecule.dci}`, async () => {
        let data = await getMoleculeData(expMolecule.dci);
        expect(data).not.null;
        expect(data.class).equals(expMolecule.class);
        expect(data.system).equals(expMolecule.system);
        expect(data.sideEffects).deep.equalInAnyOrder(expMolecule.sideEffects);
        expect(data.interactions).deep.equalInAnyOrder(expMolecule.interactions);
        expect(data.indications).deep.equalInAnyOrder(expMolecule.indications);
      });
    }
  });
}

/**
 * Get the number of entry in a table
 * @param {string} table
 * @return {Promise<number>}
 */
async function getNumberOfEntry(table) {
  const sql = `SELECT COUNT(*) as number_of_entry FROM ${table}`;
  const res = await queryPromise(sql);
  expect(res).has.length(1);
  return Number(res[0]["number_of_entry"]);
}

/**
 * Get all data of a molecule
 * @param {string} dci
 * @returns {Promise<{system : number, class : number, sideEffects : strings[], interactions : string[], indications : string[]}>}
 */
async function getMoleculeData(dci) {
  let sql = `SELECT mo_dci,cl_name as class, sy_name as system, pv_name as property_value, pr_name as property
              FROM molecule, class, system, molecule_property, property_value,property
              WHERE mo_dci = "${dci}"
              AND mo_system = sy_id
              AND mo_class = cl_id
              AND molecule.mo_id = molecule_property.mo_id
              AND molecule_property.pv_id = property_value.pv_id
              AND pv_property = pr_id`;

  let data = await queryPromise(sql);

  if (data.length === 0) {
    return null;
  }

  let molecule = Object.create(null);
  molecule.system = data[0]["system"];
  molecule.class = data[0]["class"];

  molecule.sideEffects = keepOnlyPropertyValue("sideEffects");
  molecule.indications = keepOnlyPropertyValue("indications");
  molecule.interactions = keepOnlyPropertyValue("interactions");

  return molecule;

  function keepOnlyPropertyValue(property) {
    return data.filter((row) => row["property"] === property).map((row) => row["property_value"]);
  }
}

/**
 * Get all nodes of a classification
 * @param {string} classification
 * @returns {Promise<{name : string, parents : string[]}[]>}
 */
async function getClassification(classification) {
  const singular = classification.replace(/e?s$/, "");
  const prefix = classification.slice(0, 2);
  const sql = `SELECT l3.${prefix}_name as ${singular}, l2.${prefix}_name as parent, l1.${prefix}_name as grand_parent 
              FROM ((${singular} as l1 RIGHT OUTER JOIN ${singular} as l2 ON l1.${prefix}_id = l2.${prefix}_higher) 
                RIGHT OUTER JOIN ${singular} as l3 ON l3.${prefix}_higher = l2.${prefix}_id) `;
  let res = await queryPromise(sql);
  return res.map((row) => {
    return {
      name: row[singular],
      parents: [row["parent"], row["grand_parent"]].filter((v) => v !== null),
    };
  });
}

/**
 * Get all values of a property
 * @param {string} property
 * @returns {Promise<strings[]>}
 */
async function getPropertyValuesList(property) {
  const sql = `SELECT pv_name as value
                FROM property, property_value
                WHERE pv_property = pr_id
                AND pr_name = '${property}'`;

  const values = await queryPromise(sql);

  return values.map((value) => value["value"]);
}
