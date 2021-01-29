import { readCSV, extractColumns } from "../csv_reader/Reader.js";

// eslint-disable-next-line no-unused-vars
import HeaderChecker, { HeaderErrors } from "../csv_reader/HeaderChecker.js";
import ColumnSpecifications from "../csv_reader/ParserSpecifications.js";
import FileStructure from "../csv_reader/FileStructure.js";
import Classification from "./MoleculesClassification.js";
import Property from "./MoleculesProperty.js";
import MoleculeList from "./MoleculeList.js";

const columns = [
  new ColumnSpecifications("DCI", "dci", ColumnSpecifications.UNIQUE, {
    maxlength: 128,
    key: true,
  }),
  new ColumnSpecifications("FORMULE_CHIMIQUE", "skeletal_formule", ColumnSpecifications.UNIQUE, {
    maxlength: 64,
  }),
  new ColumnSpecifications("SYSTEME_n", "systems", ColumnSpecifications.HIERARCHICAL, {
    maxlength: 128,
  }),
  new ColumnSpecifications("CLASSE_PHARMA_n", "classes", ColumnSpecifications.HIERARCHICAL, {
    maxlength: 128,
  }),
  new ColumnSpecifications("MTE", "ntr", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("INTERACTION", "interactions", ColumnSpecifications.MULTI_VALUED, {
    maxlength: 128,
  }),
  new ColumnSpecifications("INDICATION", "indications", ColumnSpecifications.MULTI_VALUED, {
    maxlength: 128,
  }),
  new ColumnSpecifications("EFFET_INDESIRABLE", "side_effects", ColumnSpecifications.MULTI_VALUED, {
    maxlength: 128,
  }),
  new ColumnSpecifications("NIVEAU_DEBUTANT", "level_easy", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("NIVEAU_EXPERT", "level_hard", ColumnSpecifications.UNIQUE),
];

/**
 * Import CSV file to parse data into an object
 * @param {string} filepath The path to the file
 * @returns {Promise<Error|HeaderErrors|JSON>}
 */
export function parseMoleculesFromCsv(filepath) {
  return new Promise((resolve, reject) => {
    readCSV(filepath)
      .then((moleculesMatrix) => {
        const columnsHeader = moleculesMatrix.shift();

        const checker = new HeaderChecker(columnsHeader, columns);
        if (!checker.check()) {
          reject(checker.getErrors());
          return;
        }

        const structure = new FileStructure(columnsHeader, columns);

        moleculesMatrix = removeInvalidMoleculeLines(
          moleculesMatrix,
          structure.getIndexesFor("dci")[0]
        );

        const data = Object.create(null);

        const nonUniqueColumns = columns.filter((column) => !column.isUnique());

        for (let column of nonUniqueColumns) {
          const creator = column.isHierarchical() ? Classification.create : Property.create;

          data[column.property] = creator(
            extractColumns(moleculesMatrix, ...structure.getIndexesFor(column.property))
          );
        }

        data.molecules = MoleculeList.create(moleculesMatrix, structure, data);

        resolve(JSON.stringify(data));
      })
      .catch(reject);
  });
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
