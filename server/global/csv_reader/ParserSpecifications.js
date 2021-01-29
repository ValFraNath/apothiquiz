/**
 * Class representing a column specifications
 */
export class ColumnSpecifications {
  /**
   * Create a column specification
   * @param {string} title The column title
   * @param {string} property The property corresponding
   * @param {number} type The columns type (unique, hierarchical, multivalued)
   * @param {{key? : boolean, maxlength? : number}} options Optional options
   */
  constructor(title, property, type, { key = false, maxlength = null } = {}) {
    this.title = title;
    this.property = property;
    this.type = type;
    this.key = key;
    this.maxlength = maxlength;
  }
  isUnique() {
    return this.type === ColumnSpecifications.UNIQUE;
  }
  isHierarchical() {
    return this.type === ColumnSpecifications.HIERARCHICAL;
  }
  isMultiValued() {
    return this.type === ColumnSpecifications.MULTI_VALUED;
  }

  /**
   * Test if a string match the column title (where "n" can be replaced by any number)
   * @param {string} value
   */
  matchTitle(value) {
    let title = this.title.replace("n", "(\\d+)");
    return new RegExp(title).test(value);
  }

  /**
   * Get the hierarchical level of a value corresponding to the title
   * @param {string} value The title value
   * @return {number}
   */
  getHierarchicalLevel(value) {
    if (this.isHierarchical() && this.matchTitle(value)) {
      let title = this.title.replace("n", "(\\d+)");
      return Number(value.match(new RegExp(title))[1]);
    }
    return null;
  }
}
ColumnSpecifications.HIERARCHICAL = 1;
ColumnSpecifications.UNIQUE = 2;
ColumnSpecifications.MULTI_VALUED = 3;

export default ColumnSpecifications;
