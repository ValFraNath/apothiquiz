import mysql from "mysql";

import { queryPromise } from "../db/database.js";

import { removeExtension } from "./Files.js";

import { addErrorTitle } from "./Logger.js";

import { normalizeDCI } from "./molecules_analyzer/moleculesAnalyzer.js";

/**
 * Update the molecule image in database, folloxing the given filenames
 * @param {string[]} filenames The list of file names
 * @returns {Promise<strings[]>} The imported files name
 */
export function bindImagesToMolecules(filenames) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT mo_dci FROM molecule;";
    queryPromise(sql).then((dbMolecules) => {
      const normalizedDbMolecules = dbMolecules.map((m) => ({
        dci: m.mo_dci,
        normalized: normalizeDCI(m.mo_dci),
      }));

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

      const sql = Object.keys(matches).reduce(
        (sql, filename) =>
          sql +
          `UPDATE molecule SET mo_image = ${mysql.escape(filename)} WHERE mo_dci = ${mysql.escape(
            matches[filename]
          )} ; `,
        ""
      );

      queryPromise(sql)
        .then(() => resolve(imported))
        .catch((error) => reject(addErrorTitle(error, "Can't update molecules images")));
    });
  });
}
