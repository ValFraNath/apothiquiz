import { queryPromise } from "../../db/database.js";
import { addErrorTitle } from "../Logger.js";

import {
  normalizeDCI,
  getInvalidNormalizedDci,
} from "../molecules_importation/moleculesAnalyzer.js";
/**
 * Analyze images filenames
 * @param {string[]} filenames
 * @returns {Promise<ImagesAnalyzerWarning[]>} The warnings list
 */
export function analyseImagesFilenames(filenames) {
  return new Promise((resolve, reject) => {
    const warnings = [];

    filenames = filenames
      .filter((f) => /\.(png|jpg|jpeg|svg)$/i.test(f))
      .map((f) => f.split(".").slice(0, -1).join(""));

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
            `Plusieurs images pour la molécule "${dup}"`
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

export class ImagesAnalyzerWarning {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

ImagesAnalyzerWarning.DUPLICATE_IMAGES = 1;
ImagesAnalyzerWarning.UNKNOWN_MOLECULES = 2;
ImagesAnalyzerWarning.INVALID_MOLECULE = 3;
