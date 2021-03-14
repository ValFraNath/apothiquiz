import { queryFormat } from "../../db/database.js";
import {
  AnalyzerWarning,
  isString,
  getTooCloseValues,
  getDuplicates,
} from "../importationUtils.js";

const NODE_NAME_MAX_LENGTH = 128;
const NODE_NAMES_MIN_DISTANCE = 2;

export const CLASSIFICATION_WARNINGS = {
  TOO_CLOSE_CLASSIFICATION_VALUES: "TOO_CLOSE_CLASSIFICATION_VALUES",
  TOO_LONG_CLASSIFICATION_VALUE: "TOO_LONG_CLASSIFICATION_VALUE",
  DUPLICATED_NODES: "DUPLICATED_NODES",
  INVALID_CLASSIFICATION_VALUE_TYPE: "INVALID_CLASSIFICATION_VALUE_TYPE",
};

/**
 * Class representing a classification, used for molecules classes and systems
 */
export default class Classification {
  /**
   * Create a new classification from a matrix
   * @param {any[][]} matrix The matrix of data
   * @param {string} name The classification name
   */
  constructor(matrix, name) {
    /** @type {string} The classificaion name */
    this.name = name;

    /** @type {ClassificationNode[]} The list of elements of the classification */
    this.elements = [];

    let autoIncrement = 1;
    for (const row of matrix) {
      /** @type {ClassificationNode} */
      let parent = null;
      for (const value of row) {
        if (!value) return;

        const same = parent ? parent.getChildByName(value) : this.getElementByName(value);
        if (same) {
          parent = same;
        } else {
          const newNode = new ClassificationNode(autoIncrement++, value, this.name);
          if (parent === null) {
            this.elements.push(newNode);
          } else {
            parent.children.push(newNode);
          }
          parent = newNode;
        }
      }
    }
  }

  /**
   * Create the script to insert a classification in database
   * @returns {string} The sql script
   */
  import() {
    return this.elements.reduce((sql, element) => `${sql} ${element.importSql()}`, "");
  }

  /**
   * Get an element by its name
   * N.B. This method searches in classification elements but not in their children
   * @returns {ClassificationNode} The found element
   */
  getElementByName(name) {
    return this.elements.find((element) => element.name === name);
  }

  /**
   * Get the list of all nodes in the classification
   * @returns {ClassificationNode[]}
   */
  toArray() {
    return this.elements.reduce((list, element) => [...list, ...element.toArray()], []);
  }

  /**
   * Analyze the classification and return a list of warnings
   * @returns {AnalyzerWarning[]} The list of warnings
   */
  analyze() {
    const warnings = [];
    const nodes = this.toArray();
    const nodeNames = nodes.map((node) => String(node.name));

    const duplicateNodes = getDuplicates(nodeNames).map(
      (node) =>
        new AnalyzerWarning(
          CLASSIFICATION_WARNINGS.DUPLICATED_NODES,
          `La valeur de ${this.name} "${node}" apparait plusieurs fois dans la hiérarchie`
        )
    );

    const tooCloseNodeNames = getTooCloseValues(nodeNames, NODE_NAMES_MIN_DISTANCE).map(
      (group) =>
        new AnalyzerWarning(
          CLASSIFICATION_WARNINGS.TOO_CLOSE_CLASSIFICATION_VALUES,
          `Ces valeurs de ${this.name} sont très proches : "${group.join('", "')}"`
        )
    );

    warnings.push(...tooCloseNodeNames);

    for (const node of nodes) {
      warnings.push(...node.analyze());
    }

    warnings.push(...duplicateNodes);

    return warnings;
  }

  /**
   * Extract to data into an array of simple object
   * @returns {object[]}
   */
  extract() {
    return this.elements.map((element) => element.extract());
  }
}

/**
 * Class representing a node in a classification
 */
export class ClassificationNode {
  /**
   * Create a new node
   * @param {number} id The node id
   * @param {string} name The node name
   * @param {string} classification The classification
   */
  constructor(id, name, classification) {
    /** @type {number} The class id */
    this.id = id;

    /** @type {string} The class name */
    this.name = name;

    /** @type {string} The classification name of the node */
    this.classification = classification;

    /** @type {ClassificationNode[]} The class children */
    this.children = [];
  }

  /**
   * Create the script to insert classification node (and its children !) in database
   * @param {number} higher The parent id
   * @param {number} level The level in the hierarchy
   * @returns {string} The sql script
   */
  importSql(higher = null, level = 1) {
    if (!this.id || !this.classification) {
      throw new Error("A classification node must be linked to a classification");
    }

    const table = String(this.classification);

    const sql = queryFormat(`INSERT INTO ${table} VALUES (:id, :name, :higher, :level );`, {
      id: Number(this.id),
      name: String(this.name).substr(0, NODE_NAME_MAX_LENGTH),
      higher: Number(higher) || null,
      level: Number(level),
    });

    return this.children.reduce(
      (sql, child) => `${sql} ${child.importSql(this.id, level + 1)}`,
      sql
    );
  }

  /**
   * Get a child node by its name
   * N.B. This method searches the direct children of the node but not their children.
   * @returns {ClassificationNode} The found child
   */
  getChildByName(name) {
    return this.children.find((child) => child.name === name);
  }

  /**
   * Get the array with this node and all its children
   * @returns {ClassificationNode[]}
   */
  toArray() {
    const nodes = [this];
    for (const child of this.children) {
      nodes.push(...child.toArray());
    }
    return nodes;
  }

  /**
   * Analyze the classification node
   * @returns {AnalyzerWarning[]}  A list of warnings
   */
  analyze() {
    const warnings = [];

    if (this.name.length > NODE_NAME_MAX_LENGTH) {
      warnings.push(
        new AnalyzerWarning(
          CLASSIFICATION_WARNINGS.TOO_LONG_CLASSIFICATION_VALUE,
          `La valeur de ${this.classification} "${this.name}" est trop longue (max ${NODE_NAME_MAX_LENGTH})`
        )
      );
    }

    if (!isString(this.name)) {
      warnings.push(
        new AnalyzerWarning(
          CLASSIFICATION_WARNINGS.INVALID_CLASSIFICATION_VALUE_TYPE,
          `La valeur de ${this.classification} "${this.name}" devrait être du texte`
        )
      );
    }

    return warnings;
  }

  /**
   * Extract data into a simple object
   * @returns {{id : number, name: string, children : object}}
   */
  extract() {
    return {
      id: this.id,
      name: this.name,
      children: this.children.map((child) => child.extract()),
    };
  }
}
