export default class Property {
  constructor(name) {
    /** @type {string} */
    this.name = name;
    /** @type {PropertyValue[]} */
    this.values = [];
  }

  /**
   * Create a property, i.e. a set of value characterized by an ID
   * @param {string[][]} matrix
   * @return {{id : number,name : string}[]}
   */
  static createFromMatrix(matrix) {
    let autoIncrementId = 1;

    for (const row of matrix) {
      for (const value of row) {
        if (!this.getValueByName(this.values, value)) {
          this.values.push({ id: autoIncrementId++, name: value });
        }
      }
    }
  }

  getValueByName(name) {
    return this.values.find((value) => value.name === name);
  }

  analyse() {}
}

export class PropertyValue {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  analyse() {}
}
