import { queryPromise } from "../../db/database.js";
import { removeExtension } from "../files.js";

import {
  normalizeDCI,
  getInvalidNormalizedDci,
} from "../molecules_importation/moleculesAnalyzer.js";

const VALID_FORMATS = ["jpeg", "jpg", "svg", "png"];
const VALID_FORMATS_REGEX = new RegExp(`\\.${VALID_FORMATS.join("|")}\\s*$`, "i");

export const isFormatValid = (filename) => VALID_FORMATS_REGEX.test(filename);

/**
 * Analyze images filenames
 * @param {string[]} filenames The list of images filenames
 * @returns {Promise<ImagesAnalyzerWarning[]>} The warnings list
 */
export async function analyseImagesFilenames(filenames) {
  const warnings = [];

  const invalidFormats = filenames.filter((f) => !isFormatValid(f));

  warnings.push(
    ...invalidFormats.map(
      (f) =>
        new ImagesAnalyzerWarning(
          ImagesAnalyzerWarning.BAD_FORMAT,
          `Format invalide : "${f}" (uniquement ${VALID_FORMATS.join(", ")})`
        )
    )
  );

  let normalizedMolecules = filenames
    .filter((f) => !invalidFormats.includes(f))
    .map(removeExtension)
    .map(normalizeDCI);

  const invalidMolecules = getInvalidNormalizedDci(normalizedMolecules);

  warnings.push(
    ...invalidMolecules.map(
      (dci) =>
        new ImagesAnalyzerWarning(
          ImagesAnalyzerWarning.INVALID_MOLECULE,
          `Molécule invalide : "${dci}" `
        )
    )
  );

  normalizedMolecules = normalizedMolecules.filter((m) => !invalidMolecules.includes(m));

  warnings.push(
    ...getDuplicates(normalizedMolecules).map(
      (dup) =>
        new ImagesAnalyzerWarning(
          ImagesAnalyzerWarning.DUPLICATE_IMAGES,
          `Plusieurs images pour la molécule "${dup}"`
        )
    )
  );

  const molecules = await getUnknownMolecules(normalizedMolecules);
  warnings.push(
    ...molecules.map(
      (molecule) =>
        new ImagesAnalyzerWarning(
          ImagesAnalyzerWarning.UNKNOWN_MOLECULES,
          `Molécule inconnue : "${molecule}"`
        )
    )
  );

  return warnings;
}

/**
 * Filter molecules name to find unknown ones
 * @param {string[]} molecules
 * @returns {Promise<String[]>} The list of unknown molecules
 */
async function getUnknownMolecules(molecules) {
  const dbMolecules = await getAllMolecules();

  const normalizedDbMolecules = dbMolecules.map(normalizeDCI);
  return molecules.filter((molecule) => !normalizedDbMolecules.includes(molecule));
}

/**
 * Returns values that appear more than once in the list
 * @param {any[]} filenames
 * @returns {any[]} non-unique values
 */
function getDuplicates(filenames) {
  return [...new Set(filenames.filter((value, i) => filenames.slice(i + 1).includes(value)))];
}

/**
 * Fetch all molecules name in database
 * @returns {Promise<String[]>}
 */
async function getAllMolecules() {
  const sql = `SELECT mo_dci FROM molecule;`;
  const res = await queryPromise(sql);
  return res.map((mol) => mol.mo_dci);
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
ImagesAnalyzerWarning.BAD_FORMAT = 4;
