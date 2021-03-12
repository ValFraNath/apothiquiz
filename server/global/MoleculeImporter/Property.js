import { queryFormat } from "../../db/database.js";
import { MoleculesAnalyzerWarning, isString, getTooCloseValues } from "../importationUtils.js";

const PROPERTY_NAME_MAX_LENGTH = 64;
const PROPERTY_VALUE_MAX_LENGTH = 128;
const PROPERTY_VALUE_MIN_DISTANCE = 2;

let propertyAutoincrementId = 1;

export default class Property {
  constructor(matrix, name) {
    /** @type {string} */
    this.name = name;
    /** @type {PropertyValue[]} */
    this.values = [];

    this.id = propertyAutoincrementId++;
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

  getValueByName(name) {
    // TODO use regex to compare without case
    return this.values.find((value) => value.name === name);
  }

  analyze() {
    const warnings = [];

    const tooCloseValues = getTooCloseValues(
      this.values.map((v) => v.name),
      PROPERTY_VALUE_MIN_DISTANCE
    ).map(
      (group) =>
        new MoleculesAnalyzerWarning(
          "TOO_CLOSE_VALUES",
          `Ces valeurs de ${this.name} sont très proches : "${group.join('", "')}"`
        )
    );

    warnings.push(tooCloseValues);

    for (const value of this.values) {
      const warning = value.analyse();
      if (warning) {
        warnings.push(warning);
      }
    }

    return warnings;
  }

  createInsertionSql() {
    const sql = queryFormat(`INSERT INTO property VALUES (:id, :name); `, {
      id: Number(this.id),
      name: String(this.name).substring(0, PROPERTY_NAME_MAX_LENGTH),
    });

    return this.values.reduce((sql, value) => `${sql} ${value.createInsertionSql()}`, sql);
  }
}

export class PropertyValue {
  constructor(id, name, propertyId) {
    this.id = id;
    this.name = name;
    this.propertyId = propertyId;
  }

  createInsertionSql() {
    return queryFormat(`INSERT INTO property_value VALUES (:id, :name, :property)`, {
      id: Number(this.id),
      name: String(this.name).substring(0, PROPERTY_VALUE_MAX_LENGTH),
      property: Number(this.propertyId),
    });
  }

  analyse() {
    /**
     * Checks that the property value is not too long
     * @returns
     */
    const isValueTooLong = () => {
      if (this.name.length > PROPERTY_VALUE_MAX_LENGTH) {
        return new MoleculesAnalyzerWarning(
          "TOO_LONG_CLASSIFICATION_VALUES",
          `La valeur de ${this.classification.name} "${this.name}" est trop longue (max ${PROPERTY_VALUE_MAX_LENGTH})`
        );
      }
      return false;
    };

    /**
     * Checks that the property value is a string is a string
     * @returns
     */
    const isValueNotString = () => {
      if (!isString(this.name)) {
        return new MoleculesAnalyzerWarning(
          "INVALID_VALUE_TYPE",
          `La valeur de ${this.classification.name} "${this.name}" devrait être du texte`
        );
      }
      return false;
    };

    return isValueNotString() || isValueTooLong() || null;
  }
}
