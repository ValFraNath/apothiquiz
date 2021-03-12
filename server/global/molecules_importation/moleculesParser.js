import path from "path";

import ColumnSpecifications from "../csv_reader/ColumnSpecification.js";
import FileStructure from "../csv_reader/FileStructure.js";

import HeaderChecker, {
  // eslint-disable-next-line no-unused-vars
  HeaderErrors,
} from "../csv_reader/HeaderChecker.js";
import { readCSV, extractColumns } from "../csv_reader/reader.js";
import Classification from "../MoleculeImporter/Classification.js";
import MoleculeList from "../MoleculeImporter/MoleculesList.js";
import Property from "../MoleculeImporter/Property.js";

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
  const moleculesMatrix = await readCSV(filepath);
  const columnsHeader = moleculesMatrix.shift();

  const checker = new HeaderChecker(columnsHeader, columns);
  if (!checker.check()) {
    throw checker.getErrors();
  }

  const structure = new FileStructure(columnsHeader, columns);

  const cleanedMoleculesMatrix = removeInvalidMoleculeLines(
    moleculesMatrix,
    structure.getIndexesFor("dci")[0]
  );

  const data = {};

  const createClassification = (name) =>
    new Classification(
      extractColumns(cleanedMoleculesMatrix, ...structure.getIndexesFor(name)),
      name
    );

  data.system = createClassification("system");

  data.class = createClassification("class");

  let propertyId = 1;
  const createProperty = (name) =>
    new Property(
      extractColumns(cleanedMoleculesMatrix, ...structure.getIndexesFor(name)),
      name,
      propertyId++
    );

  data.indications = createProperty("indications");
  data.interactions = createProperty("interactions");
  data.sideEffects = createProperty("sideEffects");

  data.molecules = new MoleculeList(cleanedMoleculesMatrix, structure, data);

  return {
    toJSON: () =>
      JSON.stringify(
        Object.getOwnPropertyNames(data).reduce((o, key) => {
          o[key] = data[key].extract();
          return o;
        }, {})
      ),
    analyze: () => {},
    import: () => {},
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

// parseMoleculesFromCsv(
//   path.resolve("server/test/molecules_importation/importation_route/files/molecules.csv")
// )
//   .then((data) => console.dir(data.toJSON(), { depth: null }))
//   .catch(console.error);
