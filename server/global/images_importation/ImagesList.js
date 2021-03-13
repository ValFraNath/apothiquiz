import mysql from "mysql";

import { queryPromise } from "../../db/database.js";
import { removeExtension } from "../files.js";
import { AnalyzerWarning, getDuplicates } from "../importationUtils.js";
import { normalizeDCI, Molecule } from "../MoleculeImporter/MoleculesList.js";

const VALID_IMAGE_EXTENSIONS = ["jpeg", "jpg", "svg", "png"];
const VALID_IMAGE_FORMAT_REGEX = new RegExp(`\\.${VALID_IMAGE_EXTENSIONS.join("|")}\\s*$`, "i");

export const IMAGE_WARNINGS = {
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_MOLECULE: "INVALID_MOLECULE",
  DUPLICATED_IMAGES: "DUPLICATED_IMAGES",
  UNKNOWN_MOLECULE: "UNKNOWN_MOLECULE",
};

export default class ImagesList {
  /**
   *
   * @param {string[]} imageNames
   */
  constructor(imageNames) {
    this.list = imageNames.map((name) => new Image(name));
  }

  async analyze() {
    const warnings = [];

    const normalizedMoleculeNames = this.list.map((image) =>
      removeExtension(normalizeDCI(image.name))
    );

    warnings.push(
      ...getDuplicates(normalizedMoleculeNames).map(
        (dup) =>
          new AnalyzerWarning(
            IMAGE_WARNINGS.DUPLICATED_IMAGES,
            `Plusieurs images pour la molécule "${dup}"`
          )
      )
    );

    warnings.push(
      ...(await this.getUnknownMolecules()).map(
        (molecule) =>
          new AnalyzerWarning(IMAGE_WARNINGS.UNKNOWN_MOLECULE, `Molécule inconnue : "${molecule}"`)
      )
    );

    for (const image of this.list) {
      warnings.push(...image.analyze());
    }

    return warnings;
  }

  async getUnknownMolecules() {
    const sql = `SELECT mo_dci FROM molecule;`;
    const dbMolecules = (await queryPromise(sql)).map((molecule) => normalizeDCI(molecule.mo_dci));

    return this.list
      .map((i) => removeExtension(normalizeDCI(i.name)))
      .filter((molecule) => !dbMolecules.includes(molecule));
  }

  async bindImagesToMolecules() {
    const filenames = this.list.map((image) => image.name).filter(Image.isFormatValid);

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
}

export class Image {
  constructor(name) {
    this.name = name;
  }

  analyze() {
    const warnings = [];

    if (!Image.isFormatValid(this.name)) {
      warnings.push(
        new AnalyzerWarning(
          IMAGE_WARNINGS.INVALID_FORMAT,
          `Format invalide : "${this.name}" (uniquement ${VALID_IMAGE_EXTENSIONS.join(", ")})`
        )
      );
    }

    if (!Molecule.isMoleculeDCIValid(removeExtension(normalizeDCI(this.name)))) {
      warnings.push(
        new AnalyzerWarning(IMAGE_WARNINGS.INVALID_MOLECULE, `Molécule invalide : "${this.name}" `)
      );
    }

    return warnings;
  }

  static isFormatValid(filename) {
    return VALID_IMAGE_FORMAT_REGEX.test(filename);
  }

  import() {}
}
