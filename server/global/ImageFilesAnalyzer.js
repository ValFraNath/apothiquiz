import { queryPromise } from "../db/database.js";
import { addErrorTitle } from "../global/Logger.js";

import { normalizeDCI, getInvalidNormalizedDci } from "./molecules_analyzer/moleculesAnalyzer.js";
/**
 * Analyze images filenames
 * @param {string[]} filenames
 */
export function analyseImageFilenames(filenames) {
  return new Promise((resolve, reject) => {
    const warnings = [];

    warnings.push(
      ...getInvalidNormalizedDci(filenames).map(
        (dci) =>
          new ImagesAnalyzerWarning(
            ImagesAnalyzerWarning.INVALID_MOLECULE,
            `Molécule invalide : "${dci}" `
          )
      )
    );

    const normalizedFilenames = filenames.map(normalizeDCI);

    warnings.push(
      ...getDuplicates(normalizedFilenames).map(
        (dup) =>
          new ImagesAnalyzerWarning(
            ImagesAnalyzerWarning.DUPLICATE_IMAGES,
            `Plusieurs image pour la molécule "${dup}"`
          )
      )
    );

    getUnknownMolecules(normalizedFilenames)
      .then((molecules) =>
        resolve([
          ...warnings,
          ...molecules.map(
            (molecule) =>
              new ImagesAnalyzerWarning(
                ImagesAnalyzerWarning.UNKNOWN_MOLECULES,
                `Molécule inconnue : "${molecule}"`
              )
          ),
        ])
      )
      .catch(reject);
  });
}

/**
 * Filter molecules name to find unknown ones
 * @param {string[]} molecules
 * @returns {Promise<String[]>} The list of unknown molecules
 */
function getUnknownMolecules(molecules) {
  return new Promise((resolve, reject) => {
    getAllMolecules()
      .then((dbMolecules) => {
        const normalizedDbMolecules = dbMolecules.map(normalizeDCI);
        console.log(normalizedDbMolecules);
        console.log(molecules);
        resolve(molecules.filter((molecule) => !normalizedDbMolecules.includes(molecule)));
      })
      .catch(reject);
  });
}

/**
 * Returns values that appear more than once in the list
 * @param {any[]} values
 * @returns {any[]} non-unique values
 */
function getDuplicates(values) {
  return [...new Set(values.filter((value, i) => values.slice(i + 1).includes(value)))];
}

/**
 * Fetch all molecules name in database
 * @returns {Promise<String[]>}
 */
function getAllMolecules() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT mo_dci FROM molecule;`;
    queryPromise(sql)
      .then((res) => resolve(res.map((mol) => mol.mo_dci)))
      .catch((error) => reject(addErrorTitle(error, "Can't fetch molecules")));
  });
}

class ImagesAnalyzerWarning {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

ImagesAnalyzerWarning.DUPLICATE_IMAGES = 1;
ImagesAnalyzerWarning.UNKNOWN_MOLECULES = 2;
ImagesAnalyzerWarning.INVALID_MOLECULE = 3;
