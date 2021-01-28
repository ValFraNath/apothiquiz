/**
 * Class representing a column specifications
 */
export class ColumnSpecifications {
  /**
   * Create a column specification
   * @param {string} title The column title
   * @param {string} property The property corresponding
   * @param {number} type The columns type (unique, hierarchical, multivalued)
   */
  constructor(title, property, type) {
    this.title = title;
    this.property = property;
    this.type = type;
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

const columns = [
  new ColumnSpecifications("DCI", "dci", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("FORMULE_CHIMIQUE", "skeletal_formule", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("SYSTEME_n", "systems", ColumnSpecifications.HIERARCHICAL),
  new ColumnSpecifications("CLASSE_PHARMA_n", "classes", ColumnSpecifications.HIERARCHICAL),
  new ColumnSpecifications("MTE", "ntr", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("INTERACTION", "interactions", ColumnSpecifications.MULTI_VALUED),
  new ColumnSpecifications("INDICATION", "indications", ColumnSpecifications.MULTI_VALUED),
  new ColumnSpecifications("EFFET_INDESIRABLE", "side_effects", ColumnSpecifications.MULTI_VALUED),
  new ColumnSpecifications("NIVEAU_DEBUTANT", "level_easy", ColumnSpecifications.UNIQUE),
  new ColumnSpecifications("NIVEAU_EXPERT", "level_hard", ColumnSpecifications.UNIQUE),
];

export default { columns };
