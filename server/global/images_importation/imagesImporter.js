import mysql from "mysql";

import { queryPromise } from "../../db/database.js";

import { removeExtension } from "../files.js";

import { addErrorTitle } from "../Logger.js";

import { normalizeDCI } from "../molecules_importation/moleculesAnalyzer.js";

import { isFormatValid } from "./imagesAnayzer.js";

/**
 * Update the molecule image in database, following the given filenames
 * @param {string[]} filenames The list of file names
 * @returns {Promise<strings[]>} The imported files name
 */
export async function bindImagesToMolecules(filenames) {
  filenames = filenames.filter(isFormatValid);

  let insertSql = "SELECT mo_dci FROM molecule;";
  const dbMolecules = await queryPromise(insertSql);

  const normalizedDbMolecules = dbMolecules.map((m) => ({
    dci: m.mo_dci,
    normalized: normalizeDCI(m.mo_dci),
  }));

  // Get all filename corresponding to a molecule
  const imported = [];

  const matches = filenames.reduce((matches, filename) => {
    const normalizedFilename = normalizeDCI(filename);

    const molecule = normalizedDbMolecules.find(
      (m) => m.normalized === removeExtension(normalizedFilename)
    );

    if (molecule) {
      matches[normalizedFilename] = molecule.dci;
      imported.push(filename);
    }

    return matches;
  }, {});

  // Update molecules images in database
  const updateSql = Object.keys(matches).reduce(
    (sql, filename) =>
      sql +
      `UPDATE molecule SET mo_image = ${mysql.escape(filename)} WHERE mo_dci = ${mysql.escape(
        matches[filename]
      )} ; `,
    "UPDATE molecule SET mo_image = NULL; "
  );

  await queryPromise(updateSql);
  return imported;
}
