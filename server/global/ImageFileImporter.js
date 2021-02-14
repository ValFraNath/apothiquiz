import mysql from "mysql";

import { queryPromise } from "../db/database.js";

import { addErrorTitle } from "./Logger.js";

import { normalizeDCI } from "./molecules_analyzer/moleculesAnalyzer.js";

export function bindImagesToMolecules(filenames) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT mo_dci FROM molecule;";
    queryPromise(sql).then((dbMolecules) => {
      const normalizedDbMolecules = dbMolecules.map((m) => ({
        dci: m.mo_dci,
        normalized: normalizeDCI(m.mo_dci),
      }));

      const normalizedFilenames = filenames.map((filename) => ({
        original: filename,
        molecule: normalizeDCI(filename.split(".").slice(0, -1).join("")),
        normalized: normalizeDCI(filename),
      }));

      const matches = normalizedFilenames.reduce((matches, filename) => {
        const molecule = normalizedDbMolecules.find((m) => m.normalized === filename.molecule);
        if (molecule) {
          matches[filename.normalized] = molecule.dci;
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
        .then(() => resolve())
        .catch((error) => reject(addErrorTitle(error, "Can't update molecules images")));
    });
  });
}
