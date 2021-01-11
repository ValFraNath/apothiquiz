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

class Property {
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
 * Array of properties, with some details about them.
 * The column field is a regex because some columns are ordered.
 */
const columns = [
  { title: "SYSTEME_(\\d+)", property: new Property("systems", true, false) },
  {
    title: "CLASSE_PHARMA_(\\d+)",
    property: new Property("classes", true, false),
  },
  { title: "INTERACTION", property: new Property("interactions", false, false) },
  { title: "INDICATION", property: new Property("indications", false, false) },
  {
    title: "EFFET_INDESIRABLE",
    property: new Property("sideEffect", false, false),
  },
  { title: "DCI", property: new Property("molecule", false, true) },
  { title: "MTE", property: new Property("ntr", false, true) },
  {
    title: "FORMULE_CHIMIQUE",
    property: new Property("skeletal_formule", false, true),
  },
  { title: "NIVEAU_DEBUTANT", property: new Property("level_easy", false, true) },
  { title: "NIVEAU_EXPERT", property: new Property("level_hard", false, true) },
];

function getNonUniqueProperties() {
  return columns.filter((column) => !column.property.isUnique()).map((column) => column.property);
}

/**
 * Import CSV file to parse data into an object
 * @param {string} filepath
 */
export function importData(filepath) {
  const excelData = readCsvFile(filepath);

  const structure = new FileStructure(excelData.shift(), columns);

  const data = Object.create(null);

  for (let property of getNonUniqueProperties()) {
    const type = property.isHierarchical() ? Classification : PropertyCategory;

    data[property.name] = new type(
      extractColumns(
        excelData,
        structure.getIndexesFor(property.name).begin,
        structure.getIndexesFor(property.name).end + 1
      )
    );
  }

  console.dir(data, { depth: null });

  return data;
}

// ***** INTERNAL FUNCTIONS *****

class FileStructure {
  /**
   * This function reads the first row and stores which index is associated with which property
   * @param {string[]} header
   * @param {{title : string, property : Property}} columns
   * @throws {ImportationError} if the spreadsheet is incorrectly formatted
   */
  constructor(header, columns) {
    this.header = header;
    this.properties = Object.create(null);
    this.columns = columns;

    this.forEachMatchingColumns((property, index, match) => {
      if (property.isHierarchical()) {
        let level = Number(match[1]);
        this.addHierachicalProperty(property.name, index, level);
      } else if (property.isUnique()) {
        this.addUniqueProperty(property.name, index);
      } else {
        this.addBasicProperty(property.name, index);
      }
    });
  }

  /**
   * @param {string} property
   */
  getIndexesFor(property) {
    return this.properties[property];
  }

  /**
   * Add a hierarchical property to the structure
   * @param {string} property
   * @param {number} index
   * @param {number} level
   * @throws {ImportationError} if the columns of the same property do not follow each other, or if the hierarchical levels are not consistent
   */
  addHierachicalProperty(property, index, level) {
    let currentValue = this.properties[property];
    if (currentValue) {
      if (currentValue.level !== level - 1) {
        throw new ImportationError("INVALID_LEVEL_VALUE");
      }
      if (currentValue.end < index - 1) {
        throw new ImportationError("Les colonnes d'une même propriété ne se suivent pas.");
      }
      currentValue.end = index;
      currentValue.level = level;
    } else {
      if (level !== 1) {
        throw Error("INVALID_LEVEL_VALUE");
      }
      this.properties[property] = {
        begin: index,
        end: index,
        level: level,
      };
    }
  }

  /**
   * Add a basic property to the structure
   * @param {string} property
   * @param {number} index
   * @throws {ImportationError} if the  columns of the same property do not follow each other
   */
  addBasicProperty(property, index) {
    let currentValue = this.properties[property];
    if (currentValue) {
      // If the property already exists -> update the end index and the level
      if (currentValue.end < index - 1) {
        throw Error("TOO_MUCH_GROUP");
      }
      currentValue.end = index;
    } else {
      this.properties[property] = {
        begin: index,
        end: index,
      };
    }
  }

  /**
   * Add a unique property to the structure
   * @param {string} property
   * @param {number} index
   * @throws {ImportationError} if a property appears more than once
   */
  addUniqueProperty(property, index) {
    if (this.properties[property]) {
      throw Error("SEVERAL_UNIQUE_PROPERTY");
    } else {
      this.properties[property] = {
        begin: index,
        end: index,
      };
    }
  }

  /**
   * Execute a callback for each columns matching the regex objects
   * @param {function} callback
   */
  forEachMatchingColumns(callback) {
    this.header.forEach((headerColumn, index) => {
      headerColumn = removeSuccessiveWhiteSpaces(headerColumn);
      if (!headerColumn) {
        return;
      }

      this.columns.forEach((column) => {
        let match = headerColumn.match(new RegExp(column.title));
        if (!match) {
          return;
        }

        callback(column.property, index, match);
      });
    });
  }
}

/**
 * Read the CSV file and parse it in a matrix
 * @param {string} filepath
 */
function readCsvFile(filepath) {
  return xlsx.parse(filepath)[0].data.filter((row) => removeSuccessiveWhiteSpaces(row[0]));
}

/**
 * Extract columns from a matrix
 * @param {array[]} matrix
 * @param {number} begin The first index
 * @param {number} end The last index (not include)
 */
function extractColumns(matrix, begin = 0, end = matrix.length) {
  const res = [];
  matrix.forEach((row) => {
    const newRow = [];

    row.forEach((value, index) => {
      if (value && index >= begin && index < end) {
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
 * Class representing a classification node,
 * characterized by an identifier, a name and
 * consisting of a node that has child nodes
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
    return null;
  }
}

class Classification {
  /**
   * Create a classification tree (not really a tree because we don't have a common root)
   * @param {string[][]} matrix
   */
  constructor(matrix) {
    let id = 0;
    const root = new ClassificationNode(id, "ROOT");

    matrix.forEach((row) => {
      let parent = root;

      row.forEach((value) => {
        value = removeSuccessiveWhiteSpaces(value);
        if (!value || !parent) {
          parent = null;
          return;
        }

        const same = parent.findChild(value);
        if (same) {
          parent = same;
        } else {
          const node = new ClassificationNode(id, value);
          parent.addChild(node);
          parent = node;
        }
      });
    });

    this.root = root;
  }

  /**
   * Get the classification as an array of top nodes
   * (only the root children, whithout the root node)
   */
  getAsArray() {
    return this.root.children;
  }

  /**
   * Find node by its name
   * @param {string} name
   */
  findNode(name) {
    return this.root.deepFindChild(name);
  }
}

class PropertyCategory {
  /**
   * Create a property
   * @param {*} matrix
   */
  constructor(matrix) {
    this.properties = Object.create(null);
    let id = 1;

    matrix.forEach((row) => {
      row.forEach((value) => {
        if (!this.properties[value]) {
          this.properties[value] = id++;
        }
      });
    });
  }
}

/**
 * Trim and remove successive white space in a string
 * @param {string} string
 */
function removeSuccessiveWhiteSpaces(string = "") {
  return string.trim().replace(/\s+/g, " ");
}

// function flatten(obj, arr) {
//   let res = arr;

//   for (let i of Object.getOwnPropertyNames(obj)) {
//     if (res.includes(i)) {
//       console.error("double", i);
//     }
//     res.push(i);
//     if (typeof obj[i] === "object") {
//       res = flatten(obj[i], res);
//     }
//   }
//   return res;
// }
