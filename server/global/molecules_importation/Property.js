import { queryFormat } from "../../db/database.js";
import { AnalyzerWarning, isString, getTooCloseValues, isSameString } from "../importationUtils.js";

const PROPERTY_NAME_MAX_LENGTH = 64;
const PROPERTY_VALUE_MAX_LENGTH = 128;
const PROPERTY_VALUE_MIN_DISTANCE = 2;

export const PROPERTY_WARNINGS = {
  TOO_CLOSE_PROPERTY_VALUES: "TOO_CLOSE_PROPERTY_VALUES",
  TOO_LONG_PROPERTY_VALUE: "TOO_LONG_PROPERTY_VALUE",
  INVALID_PROPERTY_VALUE_TYPE: "INVALID_PROPERTY_VALUE_TYPE",
};

/**
 * Class representing a property, used for molecules indications, interactions and sides effects
 */
export default class Property {
  /**
   * Create a new property from a matrix
   * @param {any[][]} matrix The matrix of data
   * @param {string} name The property name
   * @param {number} id The property id
   */
  constructor(matrix, name, id) {
    this.name = name;
    this.id = id;

    /** @type {PropertyValue[]} */
    this.values = [];

    let autoIncrementId = 1;
    const uniqueId = () => Number(`${this.id}${autoIncrementId++}`);

    for (const row of matrix) {
      for (const value of row) {
        if (this.getValueByName(value)) {
          continue;
        }
        const newValue = new PropertyValue(uniqueId(), value, this.id);
        this.values.push(newValue);
      }
    }
  }

  /**
   * Get a value of this property by its name
   * @param {string} name The property value name
   * @returns {PropertyValue}
   */
  getValueByName(name) {
    return this.values.find((value) => isSameString(name, value.name));
  }

  /**
   * Analyze the property and return a list of warnings
   * @returns {AnalyzerWarning[]}
   */
  analyze() {
    const warnings = [];

    const tooCloseValues = getTooCloseValues(
      this.values.map((v) => v.name),
      PROPERTY_VALUE_MIN_DISTANCE
    ).map(
      (group) =>
        new AnalyzerWarning(
          PROPERTY_WARNINGS.TOO_CLOSE_PROPERTY_VALUES,
          `Ces valeurs de ${this.name} sont très proches : "${group.join('", "')}"`
        )
    );

    warnings.push(...tooCloseValues);

    for (const value of this.values) {
      warnings.push(...value.analyse());
    }

    return warnings;
  }

  /**
   * Create the sql script to insert the propertu in the database
   * @returns {string}
   */
  importSql() {
    const sql = queryFormat(`INSERT INTO property VALUES (:id, :name); `, {
      id: Number(this.id),
      name: String(this.name).substring(0, PROPERTY_NAME_MAX_LENGTH),
    });

    return this.values.reduce((sql, value) => `${sql} ${value.importSql()}`, sql);
  }

  /**
   * Extract data into an array of simple object
   * @returns {object[]}
   */
  extract() {
    return this.values.map((value) => value.extract());
  }
}

/**
 * Class representing a value of a propety
 */
export class PropertyValue {
  /**
   * Create a property value
   * @param {number} id The value id
   * @param {string} name The value id
   * @param {number} propertyId The if of the property
   */
  constructor(id, name, propertyId) {
    this.id = id;
    this.name = name;
    this.propertyId = propertyId;
  }

  /**
   * Create the sql script to insert the property value in database
   * @returns {string}
   */
  importSql() {
    return queryFormat(`INSERT INTO property_value VALUES (:id, :name, :property); `, {
      id: Number(this.id),
      name: String(this.name).substring(0, PROPERTY_VALUE_MAX_LENGTH),
      property: Number(this.propertyId),
    });
  }

  /**
   * Extract data into a simple object
   * @returns {{id: number, name: string}}
   */
  extract() {
    return {
      id: this.id,
      name: this.name,
    };
  }

  /**
   * Analyze the property value
   * @returns {AnalyzerWarning[]} A list of warnings
   */
  analyse() {
    const warnings = [];

    if (this.name.length > PROPERTY_VALUE_MAX_LENGTH) {
      warnings.push(
        new AnalyzerWarning(
          PROPERTY_WARNINGS.TOO_LONG_PROPERTY_VALUE,
          `La valeur de ${this.classification} "${this.name}" est trop longue (max ${PROPERTY_VALUE_MAX_LENGTH})`
        )
      );
    }

    if (!isString(this.name)) {
      warnings.push(
        new AnalyzerWarning(
          PROPERTY_WARNINGS.INVALID_PROPERTY_VALUE_TYPE,
          `La valeur de ${this.classification} "${this.name}" devrait être du texte`
        )
      );
    }

    return warnings;
  }
}
