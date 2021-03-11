import { MoleculesAnalyzerWarning, isString, getTooCloseValues } from "../importationUtils.js";

const VALUE_MAX_LENGTH = 128;
const VALUE_MIN_DISTANCE = 2;

let propertyAutoincrementId = 1;

export default class Property {
  constructor(matrix, name) {
    /** @type {string} */
    this.name = name;
    /** @type {PropertyValue[]} */
    this.values = [];

    this.id = propertyAutoincrementId++;
    let autoIncrementId = 1;

    for (const row of matrix) {
      for (const value of row) {
        if (!this.getValueByName(value)) {
          this.values.push(new PropertyValue(Number(`${this.id}${autoIncrementId++}`), value));
        }
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
      VALUE_MIN_DISTANCE
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
}

export class PropertyValue {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  analyse() {
    /**
     * Checks that the property value is not too long
     * @returns
     */
    const isValueTooLong = () => {
      if (this.name.length > VALUE_MAX_LENGTH) {
        return new MoleculesAnalyzerWarning(
          "TOO_LONG_CLASSIFICATION_VALUES",
          `La valeur de ${this.classification.name} "${this.name}" est trop longue (max ${VALUE_MAX_LENGTH})`
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
