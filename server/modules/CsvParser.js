import xlsx from "node-xlsx";

export class ImportationError extends Error {
  constructor(message, code) {
    super();
    this.message = message;
    this.code = code;
    this.name = "FileFormatError";
  }
  static isInstance(error) {
    return error instanceof ImportationError;
  }
}

/**
 * Class representing the details of a category of property of a column in the CSV file.
 */
class PropertyCategorySpecifications {
  constructor(name, hierachical = false, unique = false) {
    this.name = name;
    this.hierachical = hierachical;
    this.unique = unique;
  }
  isUnique() {
    return this.unique;
  }
  isHierarchical() {
    return this.hierachical;
  }
}

/**
 * Array of columns in CSV file we want to extract.
 *  with some details about them.
 * The column field is a regex because some columns are ordered and we need to match different digits
 */
const columns = [
  {
    title: "SYSTEME_(\\d+)",
    propertyCategory: new PropertyCategorySpecifications("systems", true, false),
  },
  {
    title: "CLASSE_PHARMA_(\\d+)",
    propertyCategory: new PropertyCategorySpecifications("classes", true, false),
  },
  {
    title: "INTERACTION",
    propertyCategory: new PropertyCategorySpecifications("interactions", false, false),
  },
  {
    title: "INDICATION",
    propertyCategory: new PropertyCategorySpecifications("indications", false, false),
  },
  {
    title: "EFFET_INDESIRABLE",
    propertyCategory: new PropertyCategorySpecifications("side_effects", false, false),
  },
  { title: "DCI", propertyCategory: new PropertyCategorySpecifications("dci", false, true) },
  { title: "MTE", propertyCategory: new PropertyCategorySpecifications("ntr", false, true) },
  {
    title: "FORMULE_CHIMIQUE",
    propertyCategory: new PropertyCategorySpecifications("skeletal_formule", false, true),
  },
  {
    title: "NIVEAU_DEBUTANT",
    propertyCategory: new PropertyCategorySpecifications("level_easy", false, true),
  },
  {
    title: "NIVEAU_EXPERT",
    propertyCategory: new PropertyCategorySpecifications("level_hard", false, true),
  },
];

/**
 * Import CSV file to parse data into an object
 * @param {string} filepath
 * @return {JSON}
 */
export function importData(filepath) {
  const excelData = cleanUpStringsInMatrix(readCsvFile(filepath));

  const structure = new FileStructure(excelData.shift(), columns);

  const data = Object.create(null);

  const nonUniqueFilter = (propertyCategory) => !propertyCategory.isUnique();

  for (let propertyCategory of getFilteredPropertyCategories(nonUniqueFilter)) {
    const typeOfCategory = propertyCategory.isHierarchical() ? Classification : PropertyCategory;

    data[propertyCategory.name] = new typeOfCategory(
      extractColumns(excelData, ...structure.getIndexesFor(propertyCategory.name))
    ).extract();
  }

  data.molecules = new MoleculeList(excelData, structure, data).extract();

  console.error(JSON.stringify(data));

  return JSON.stringify(data);
}

// ***** INTERNAL FUNCTIONS *****

/**
 * Filter columns to extract only non unique categories of property
 * @param {function(PropertyCategorySpecifications)} predicate
 */
function getFilteredPropertyCategories(predicate) {
  return columns
    .filter((column) => predicate(column.propertyCategory))
    .map((column) => column.propertyCategory);
}

/**
 * Read the CSV file and parse it in a matrix
 * @param {string} filepath
 */
function readCsvFile(filepath) {
  return xlsx.parse(filepath)[0].data.filter((row) => row[0] !== undefined);
}

/**
 * Trim and remove successive whitespaces in all strings of the matrix
 * @param {any[][]} matrix
 */
function cleanUpStringsInMatrix(matrix) {
  return matrix.map((row) =>
    row.map((value) => (isString(value) ? removeSuccessiveWhiteSpaces(value) : value))
  );
}

function isString(variable) {
  return variable instanceof String || typeof variable === "string";
}

/**
 * Extract columns from a matrix
 * @param {array[]} matrix
 * @param {number} begin The first index
 * @param {number} end The last index (not include)
 */
function extractColumns(matrix, ...indexes) {
  const res = [];
  matrix.forEach((row) => {
    const newRow = [];

    row.forEach((value, index) => {
      if (value && indexes.includes(index)) {
        newRow.push(value);
      }
    });

    if (newRow.length) {
      res.push(newRow);
    }
  });
  return res;
}

/**
 * Trim and remove successive white space in a string
 * @param {string} string
 */
function removeSuccessiveWhiteSpaces(string = "") {
  return string.trim().replace(/\s+/g, " ");
}

// ***** CLASSES *****

/**
 * Class representing the structure of the CSV file, i.e. which columns correspond to which property.
 */
class FileStructure {
  /**
   * This function reads the first row and stores which index is associated with which property
   * @param {string[]} header The CSV file first row
   * @param {{title : string, property : PropertyCategorySpecifications}[]} requiredColumns The columns we want to extract
   * @throws {ImportationError} if the spreadsheet is incorrectly formatted
   */
  constructor(header, requiredColumns) {
    this.header = header;
    this.propertiesIndexes = Object.create(null);
    this.requiredColumns = requiredColumns;

    this._forEachCorrespondingColumns((property, index) => {
      this._addProperty(property.name, index);
    });
  }

  /**
   * @param {string} property
   * @return {number[]} Indexes
   */
  getIndexesFor(property) {
    return (this.propertiesIndexes[property] || []).slice();
  }

  /**
   * Add a property to the structure
   * @param {PropertyCategorySpecifications} property
   * @param {number} index
   * @param {number} level
   * @throws {ImportationError} if en error has occured during the importation
   */
  _addProperty(property, index) {
    let currentIndexes = this.propertiesIndexes[property];
    if (currentIndexes) {
      currentIndexes.push(index);
    } else {
      this.propertiesIndexes[property] = [index];
    }
  }

  /**
   * Iterate through all the header columns and run a callback for each one corresponding to a required column
   * @param {function(PropertyCategorySpecifications,number,number|undefined)} callback - Function to execute for each column corresponding to a property
   */
  _forEachCorrespondingColumns(callback) {
    this.header.forEach((headerColumn, index) => {
      if (!headerColumn) {
        return;
      }

      this.requiredColumns.forEach((requiredColumn) => {
        if (new RegExp(requiredColumn.title).test(headerColumn)) {
          callback(requiredColumn.propertyCategory, index);
        }
      });
    });
  }
}

/**
 * Class representing a classification node,
 * characterized by an identifier, a name and
 * consisting of a node that has child nodes.
 */
class ClassificationNode {
  /**
   * Create a new node
   * @param {number} id
   * @param {string} name
   */
  constructor(id, name) {
    this.id = id;
    this.name = name;

    /**@type {ClassificationNode[]} */
    this.children = [];
  }

  /**
   * Add a node child
   * @param {ClassificationNode} node
   */
  addChild(node) {
    this.children.push(node);
  }

  /**
   * Find a node by name among direct children
   * @param {string} name
   * @returns {ClassificationNode|undefined}
   */
  findChild(name) {
    return this.children.find((node) => node.name === name);
  }

  /**
   * Find a node by name, among all descendants
   * @param {string} name
   * @return {ClassificationNode | undefined}
   */
  deepFindChild(name) {
    let res = null;
    for (let child of this.children) {
      if (child.name === name) {
        return child;
      }
      res = child.deepFindChild(name);
      if (res) {
        return res;
      }
    }
    //console.log(name);
    return null;
  }
}

/**
 * Class representing a classification,
 * made up of a tree of ClassificationNode.
 */
class Classification {
  /**
   * Create a classification tree (not really a tree because we don't have a common root)
   * @param {string[][]} matrix
   */
  constructor(matrix) {
    ///console.log(matrix);
    let id = 0;
    const root = new ClassificationNode(id++, "ROOT");

    matrix.forEach((row) => {
      let parent = root;

      row.forEach((value) => {
        if (!value || !parent) {
          parent = null;
          return;
        }

        const same = parent.findChild(value);
        if (same) {
          parent = same;
        } else {
          const node = new ClassificationNode(id++, value);
          parent.addChild(node);
          parent = node;
        }
      });
    });

    this.root = root;
    // this.findNode = this.findNode.bind(this);
  }

  /**
   * Get the classification as an array of top nodes
   * (only the root children, whithout the root node)
   */
  extract() {
    return this.root.children;
  }

  /**
   * Find node by its name
   * @param {ClassificationNode[]} classification
   * @param {string} name
   */
  static findId(classification, name) {
    for (let child of classification) {
      if (child.name === name) {
        return child.id;
      }
      let found = child.deepFindChild(name);
      if (found) {
        return found.id;
      }
    }
    return null;
  }
}

/**
 * Class representing a category of properties,
 * composed of a list of values and their identifiers.
 */
class PropertyCategory {
  /**
   * Create a property
   * @param {*} matrix
   */
  constructor(matrix) {
    this.values = Object.create(null);
    let id = 1;

    matrix.forEach((row) => {
      row.forEach((value) => {
        if (!this.values[value]) {
          this.values[value] = id++;
        }
      });
    });
  }

  /**
   * Return the list of values as map value -> id
   * @return {object}
   */
  extract() {
    return this.values;
  }

  /**
   * @param {object}
   * @param {string} name
   */
  static findId(property, name) {
    return property[name];
  }
}

class MoleculeList {
  constructor(matrix, structure, data) {
    this.list = [];
    this.id = 1;
    this.structure = structure;
    this.data = data;

    matrix.forEach((row) => {
      let molecule = new Molecule(this.id++);

      this.setUniqueProperties(molecule, row);
      this.setClassifications(molecule, row);
      this.setProperties(molecule, row);

      this.list.push(molecule);
    });
  }

  extract() {
    return this.list;
  }

  /**
   * @param {Molecule} molecule
   * @param {string[]} row
   */
  setUniqueProperties(molecule, row) {
    getFilteredPropertyCategories((cat) => cat.isUnique()).forEach((propertyCategory) =>
      molecule.setUniqueProperty({
        property: propertyCategory.name,
        value: row[this.structure.getIndexesFor(propertyCategory.name)],
      })
    );
  }

  /**
   * @param {Molecule} molecule
   * @param {string[]} row
   */
  setClassifications(molecule, row) {
    getFilteredPropertyCategories((cat) => cat.isHierarchical()).forEach((propertyCategory) => {
      const indexes = this.structure.getIndexesFor(propertyCategory.name);

      let value = row[indexes.pop()];
      while (!value && indexes.length) {
        value = row[indexes.pop()];
      }

      if (!value) {
        return;
      }

      const id = Classification.findId(this.data[propertyCategory.name], value);

      molecule.setMemberOf({
        classification: propertyCategory.name,
        value: id,
      });
    });
  }

  /**
   * @param {Molecule} molecule
   * @param {string[]} row
   */
  setProperties(molecule, row) {
    getFilteredPropertyCategories((cat) => !cat.isHierarchical() && !cat.isUnique()).forEach(
      (propertyCategory) => {
        const indexes = this.structure.getIndexesFor(propertyCategory.name);

        let values = row.filter((_, i) => indexes.includes(i));
        values = values.map((value) =>
          PropertyCategory.findId(this.data[propertyCategory.name], value)
        );

        values.forEach((value) => molecule.addProperty({ property: propertyCategory.name, value }));
      }
    );
  }
}

class Molecule {
  /**
   *
   * @param {string} dci
   */
  constructor(id) {
    this.id = id;
    this.uniqueProperties = Object.create(null);
    this.classifications = Object.create(null);
    this.properties = Object.create(null);
  }

  /**
   * Add a unique property to a molecule
   * @param {*} param0
   */
  setUniqueProperty({ property, value }) {
    if (
      getFilteredPropertyCategories((cat) => cat.isUnique())
        .map((cat) => cat.name)
        .includes(property)
    ) {
      this.uniqueProperties[property] = value;
    }
  }

  setMemberOf({ classification, value }) {
    if (
      getFilteredPropertyCategories((cat) => cat.isHierarchical())
        .map((cat) => cat.name)
        .includes(classification)
    ) {
      this.classifications[classification] = value;
    }
  }

  addProperty({ property, value }) {
    if (
      getFilteredPropertyCategories((cat) => !cat.isHierarchical() && !cat.isUnique())
        .map((cat) => cat.name)
        .includes(property)
    ) {
      if (!this.properties[property]) {
        this.properties[property] = [value];
      } else {
        this.properties[property].push(value);
      }
    }
  }
}
