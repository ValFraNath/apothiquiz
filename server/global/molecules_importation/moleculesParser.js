import ColumnSpecifications from "../csv_reader/ColumnSpecification.js";
import FileStructure from "../csv_reader/FileStructure.js";

import HeaderChecker, {
  // eslint-disable-next-line no-unused-vars
  HeaderErrors,
} from "../csv_reader/HeaderChecker.js";
import { readCSV, extractColumns } from "../csv_reader/reader.js";

import Classification from "../MoleculeImporter/Classification.js";

import MoleculeList from "./MoleculeList.js";
import Property from "./MoleculesProperty.js";

const columns = [
  new ColumnSpecifications("DCI", "dci", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("FORMULE_CHIMIQUE", "skeletalFormula", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("SYSTEME_n", "systems", ColumnSpecifications.HIERARCHICAL),
  new ColumnSpecifications("CLASSE_PHARMA_n", "classes", ColumnSpecifications.HIERARCHICAL),
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
 * @returns {Promise<JSON>}
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

  const data = Object.create(null);

  const nonUniqueColumns = columns.filter((column) => !column.isUnique());

  for (let column of nonUniqueColumns) {
    const creator = column.isHierarchical() ? Classification.createFromMatrix : Property.create;

    data[column.property] = creator(
      extractColumns(cleanedMoleculesMatrix, ...structure.getIndexesFor(column.property))
    );
  }

  data.molecules = MoleculeList.create(cleanedMoleculesMatrix, structure, data);

  return JSON.stringify(data);
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
