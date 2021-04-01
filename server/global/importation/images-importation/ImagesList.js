import { queryFormat, queryPromise } from "../../../db/database.js";
import { removeExtension } from "../../files.js";
import { AnalyzerWarning, getDuplicates } from "../../importationUtils.js";
import { Molecule } from "../molecules-importation/MoleculesList.js";

const { normalizeDCI } = Molecule;

const VALID_IMAGE_EXTENSIONS = ["jpeg", "jpg", "svg", "png"];
const VALID_IMAGE_FORMAT_REGEX = new RegExp(`\\.${VALID_IMAGE_EXTENSIONS.join("|")}\\s*$`, "i");

export const IMAGE_WARNINGS = {
  INVALID_FORMAT: "INVALID_FORMAT",
  INVALID_MOLECULE: "INVALID_MOLECULE",
  DUPLICATED_IMAGES: "DUPLICATED_IMAGES",
  UNKNOWN_MOLECULE: "UNKNOWN_MOLECULE",
};

/**
 * Class representing a list of images
 */
export default class ImagesList {
  /**
   * Create an images list
   * @param {string[]} imageNames
   */
  constructor(imageNames) {
    this.list = imageNames.map((name) => new Image(name));
  }

  /**
   * Analyze the images list
   * @returns {Promise<AnalyzerWarning[]>} A list of warnings
   */
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

  /**
   * Get all molecules from this list unknown in database
   * @returns {string[]} The unknown molecule names
   */
  async getUnknownMolecules() {
    const sql = `SELECT mo_dci FROM molecule;`;
    const dbMolecules = (await queryPromise(sql)).map((molecule) => normalizeDCI(molecule.mo_dci));

    return this.list
      .map((i) => removeExtension(normalizeDCI(i.name)))
      .filter((molecule) => !dbMolecules.includes(molecule));
  }

  /**
   * Binds the images to existing molecules
   * @returns {Promise<string[]>} The list of imported images
   */
  async bindImagesToMolecules() {
    const filenames = this.list.map((image) => image.name).filter(Image.isFormatValid);

    // Get all molecules in database
    const dbMolecules = await queryPromise("SELECT mo_dci FROM molecule;");

    // Normalize their names
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
    let updateSql = "UPDATE molecule SET mo_image = NULL; ";

    for (const filename of Object.keys(matches)) {
      updateSql += queryFormat(
        "UPDATE molecule SET mo_image = :image WHERE mo_dci = :molecule ; ",
        { image: filename, molecule: matches[filename] }
      );
    }

    await queryPromise(updateSql);
    return imported;
  }
}

/**
 * Class representing an image
 */
export class Image {
  /**
   * Create an image
   * @param {string} name The image name
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * Analyze the image
   * @returns {AnalyzerWarning[]} A list of warnings
   */
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

  /**
   * Checks if the image format is valid
   * @param {string} filename The image filename
   * @returns {boolean}
   */
  static isFormatValid(filename) {
    return VALID_IMAGE_FORMAT_REGEX.test(filename);
  }
}
