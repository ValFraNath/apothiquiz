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
 * This object is a map "column name" -> propery (with some details about properties)
 * The column name is a regex because some columns are ordered.
 */
const columnToProperty = {
  "SYSTEME_(\\d+)": { name: "systems", hierachical: true, unique: false },
  "CLASSE_PHARMA_(\\d+)": {
    name: "classes",
    hierachical: true,
    unique: false,
  },
  INTERACTION: { name: "interactions", hierachical: false, unique: false },
  INDICATION: { name: "indications", hierachical: false, unique: false },
  EFFET_INDESIRABLE: {
    name: "sideEffect",
    hierachical: false,
    unique: false,
  },
  DCI: { name: "molecule", hierachical: false, unique: true },
  MTE: { name: "ntr", hierachical: false, unique: true },
  FORMULE_CHIMIQUE: {
    name: "skeletal_formule",
    hierachical: false,
    unique: true,
  },
  NIVEAU_DEBUTANT: { name: "level_easy", hierachical: false, unique: true },
  NIVEAU_EXPERT: { name: "level_hard", hierachical: false, unique: true },
};

/**
 * Import CSV file to parse data into an object
 * @param {*} filepath
 */
export function importData(filepath) {
  const data = Object.create(null);

  const excelData = readCsvFile(filepath);

  const colsIndexes = extractColumnsStructure(excelData.shift());

  for (let property of getNonUniqueProperty()) {
    const create = property.hierachical ? createClassification : createProperties;

    data[property.name] = create(
      extractColumns(
        excelData,
        colsIndexes[property.name].begin,
        colsIndexes[property.name].end + 1
      )
    );
  }

  return data;
}

// ***** INTERNAL FUNCTIONS *****

/**
 * Filter the property object to keep only non unique ones
 */
function getNonUniqueProperty() {
  return Object.getOwnPropertyNames(columnToProperty)
    .filter((property) => !columnToProperty[property].unique)
    .map((property) => columnToProperty[property]);
}

/**
 * This function reads the first row and stores which index is associated with which property
 * @param {array} header
 * @throws {ImportationError} if the spreadsheet is incorrectly formatted
 */
function extractColumnsStructure(header) {
  const columnsStructure = Object.create(null);

  forEachMatchingColumns((property, index, match) => {
    if (property.hierachical) {
      let level = Number(match[1]);
      addHierachicalProperty(property.name, index, level);
    } else if (property.unique) {
      addUniqueProperty(property.name, index);
    } else {
      addBasicProperty(property.name, index);
    }
  });

  return columnsStructure;

  // Functions

  /**
   * Add a hierarchical property to the structure
   * @param {string} property
   * @param {number} index
   * @param {number} level
   * @throws {ImportationError} if the columns of the same property do not follow each other, or if the hierarchical levels are not consistent
   */
  function addHierachicalProperty(property, index, level) {
    let currentValue = columnsStructure[property];
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
      columnsStructure[property] = {
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
  function addBasicProperty(property, index) {
    let currentValue = columnsStructure[property];
    if (currentValue) {
      // If the property already exists -> update the end index and the level
      if (currentValue.end < index - 1) {
        throw Error("TOO_MUCH_GROUP");
      }
      currentValue.end = index;
    } else {
      columnsStructure[property] = {
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
  function addUniqueProperty(property, index) {
    if (columnsStructure[property]) {
      throw Error("SEVERAL_UNIQUE_PROPERTY");
    } else {
      columnsStructure[property] = {
        begin: index,
        end: index,
      };
    }
  }

  /**
   * Execute a callback for each columns matching the regex objects
   * @param {function} callback
   */
  function forEachMatchingColumns(callback) {
    header.forEach((column, index) => {
      column = removeSuccessiveWhiteSpaces(column);
      if (!column) {
        return;
      }

      Object.getOwnPropertyNames(columnToProperty).forEach((regex) => {
        let match = column.match(new RegExp(regex));
        if (!match) {
          return;
        }
        let property = columnToProperty[regex];
        callback(property, index, match);
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
 * Create a classification tree (not really a tree because we don't have a common root) -> each node has an id, a name, and array of childen
 * @param {arrray} array
 */
function createClassification(array) {
  function createNode(value) {
    const node = Object.create(null);
    node.id = id++;
    node.name = value;
    node.children = [];
    node.findChild = (name) => node.children.find((node) => node.name === name);
    node.deepFindChild = (name) => {
      let res = null;
      for (let child of node.children) {
        if (child.name === name) {
          return child;
        }
        res = child.deepFindChild(name);
        if (res) {
          return res;
        }
      }
      return null;
    };
    return node;
  }

  let id = 0;
  const root = createNode("ROOT");

  array.forEach((row) => {
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
        const node = createNode(value);
        parent.children.push(node);
        parent = node;
      }
    });
  });

  const res = root.children;
  res.getNode = (name) => root.deepFindChild(name);
  return res;
}

/**
 * Create a list of value name -> id
 * @param {array[]} matrix
 */
function createProperties(matrix) {
  const property = Object.create(null);
  let id = 1;

  matrix.forEach((row) => {
    row.forEach((value) => {
      if (!property[value]) {
        property[value] = id++;
      }
    });
  });

  return property;
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

/**
 * Trim and remove successive white space in a string
 * @param {string} string
 */
function removeSuccessiveWhiteSpaces(string = "") {
  return string.trim().replace(/\s+/g, " ");
}
