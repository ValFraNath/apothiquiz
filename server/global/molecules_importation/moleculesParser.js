import ColumnSpecifications from "../csv_reader/ColumnSpecification.js";
import FileStructure from "../csv_reader/FileStructure.js";

import HeaderChecker, {
  // eslint-disable-next-line no-unused-vars
  HeaderErrors,
} from "../csv_reader/HeaderChecker.js";
import { readCSV, extractColumns } from "../csv_reader/reader.js";
import {
  clearDatabaseTablesSql,
  transationBeginSql,
  transationEndSql,
} from "../importationUtils.js";

import MoleculeList from "../molecules_importation/MoleculesList.js";
import Property from "../molecules_importation/Property.js";

import Classification from "./Classification.js";

const columns = [
  new ColumnSpecifications("DCI", "dci", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("FORMULE_CHIMIQUE", "skeletalFormula", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("SYSTEME_n", "system", ColumnSpecifications.HIERARCHICAL),
  new ColumnSpecifications("CLASSE_PHARMA_n", "class", ColumnSpecifications.HIERARCHICAL),
  new ColumnSpecifications("MTE", "ntr", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("INTERACTION", "interactions", ColumnSpecifications.MULTI_VALUED),
  new ColumnSpecifications("INDICATION", "indications", ColumnSpecifications.MULTI_VALUED),
  new ColumnSpecifications("EFFET_INDESIRABLE", "sideEffects", ColumnSpecifications.MULTI_VALUED),
  new ColumnSpecifications("NIVEAU_DEBUTANT", "levelEasy", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("NIVEAU_EXPERT", "levelHard", ColumnSpecifications.UNIQUE),
];

/**
 * Import CSV file to parse data into an object
 * @param {string} filepath The path to the file
 
 * @throws {HeaderErrors}
 */
export async function parseMoleculesFromCsv(filepath) {
  // Read the csv file
  const moleculesMatrix = await readCSV(filepath);

  // Checks that the file header matches the columns specifications
  const columnsHeader = moleculesMatrix.shift();
  const checker = new HeaderChecker(columnsHeader, columns);
  if (!checker.check()) {
    throw checker.getErrors();
  }

  // Defines the structure of the file following the header of the file
  const structure = new FileStructure(columnsHeader, columns);

  // Keep only valid rows, i.e. those whose DCI value is different from null
  const cleanedMoleculesMatrix = removeInvalidMoleculeLines(
    moleculesMatrix,
    structure.getIndexesFor("dci")[0]
  );

  const data = {};
  let propertyId = 1;

  /**
   * Create a classification
   * @param {string} name The classification name
   * @returns {Classification}
   */
  const createClassification = (name) =>
    new Classification(
      // Keep only the columns of the file dealing with the given classification
      extractColumns(cleanedMoleculesMatrix, ...structure.getIndexesFor(name)),
      name
    );

  /**
   * Create a property
   * @param {string} name The classification name
   * @returns {Property}
   */
  const createProperty = (name) =>
    new Property(
      // Keep only the columns of the file dealing with the given property
      extractColumns(cleanedMoleculesMatrix, ...structure.getIndexesFor(name)),
      name,
      propertyId++
    );

  // Creates the differents classifications, properties & molecules
  data.system = createClassification("system");
  data.class = createClassification("class");

  data.indications = createProperty("indications");
  data.interactions = createProperty("interactions");
  data.sideEffects = createProperty("sideEffects");

  data.molecules = new MoleculeList(cleanedMoleculesMatrix, structure, data);

  return {
    /**
     *
     * @returns
     */
    toJSON: () =>
      JSON.stringify(
        Object.getOwnPropertyNames(data).reduce((o, key) => {
          o[key] = data[key].extract();
          return o;
        }, {})
      ),
    /**
     *
     * @returns
     */
    analyze: () =>
      Object.getOwnPropertyNames(data).reduce(
        (warnings, key) => [...warnings, ...data[key].analyze()],
        []
      ),
    /**
     * Create the sql script to import data
     * @returns
     */
    import: () => {
      let script = transationBeginSql();
      script += clearDatabaseTablesSql(
        "molecule",
        "class",
        "system",
        "property",
        "property_value",
        "molecule_property"
      );

      script += [
        "class",
        "system",
        "indications",
        "interactions",
        "sideEffects",
        "molecules",
      ].reduce((sql, key) => sql + data[key].import(), "");

      script += transationEndSql();

      // console.log(script);

      return script;
    },
  };
}

// ***** INTERNAL FUNCTIONS *****

/**
 * Returns the matrix without rows where the molecule dci is empty.
 * @param {[][]} matrix
 * @param {number} dciIndex The index of the dci column
 * @return {[][]}
 */
function removeInvalidMoleculeLines(matrix, dciIndex) {
  return matrix.filter((row) => row[dciIndex]);
}
