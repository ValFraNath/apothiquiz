import mysql from "mysql";

import { queryPromise } from "../../db/database.js";

import { removeExtension } from "../Files.js";

import { addErrorTitle } from "../Logger.js";

import { normalizeDCI } from "../molecules_importation/moleculesAnalyzer.js";

import { isFormatValid } from "./imagesAnayzer.js";

/**
 * Update the molecule image in database, following the given filenames
 * @param {string[]} filenames The list of file names
 * @returns {Promise<strings[]>} The imported files name
 */
export function bindImagesToMolecules(filenames) {
  return new Promise((resolve, reject) => {
    filenames = filenames.filter(isFormatValid);

    const sql = "SELECT mo_dci FROM molecule;";
    queryPromise(sql)
      .then((dbMolecules) => {
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
        const sql = Object.keys(matches).reduce(
          (sql, filename) =>
            sql +
            `UPDATE molecule SET mo_image = ${mysql.escape(filename)} WHERE mo_dci = ${mysql.escape(
              matches[filename]
            )} ; `,
          "UPDATE molecule SET mo_image = NULL; "
        );

        queryPromise(sql)
          .then(() => resolve(imported))
          .catch((error) => reject(addErrorTitle(error, "Can't update molecules images")));
      })
      .catch((error) => reject(addErrorTitle(error, "Can't get molecules")));
  });
}
