import { queryFormat } from "../../db/database.js";
import {
  MoleculesAnalyzerWarning,
  isString,
  getTooCloseValues,
  getDuplicates,
} from "../importationUtils.js";

const NODE_NAME_MAX_LENGTH = 128;
const NODE_NAMES_MIN_DISTANCE = 2;

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
   * @returns
   */
  createInsertionSql() {
    return this.elements.reduce((sql, element) => `${sql} ${element.createInsertionSql()}`, "");
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

  analyze() {
    const warnings = [];
    const nodes = this.toArray();
    const nodeNames = nodes.map((node) => String(node.name));

    const duplicateNodes = getDuplicates(nodeNames).map(
      (node) =>
        new MoleculesAnalyzerWarning(
          "DUPLICATE_NODES",
          `La valeur de ${this.name} "${node}" apparait plusieurs fois dans la hiérarchie`
        )
    );

    const tooCloseNodeNames = getTooCloseValues(nodeNames, NODE_NAMES_MIN_DISTANCE).map(
      (group) =>
        new MoleculesAnalyzerWarning(
          "TOO_CLOSE_VALUES",
          `Ces valeurs de ${this.name} sont très proches : "${group.join('", "')}"`
        )
    );

    warnings.push(...tooCloseNodeNames);

    for (const node of nodes) {
      const warning = node.analyze();
      if (warning) {
        warnings.push(warning);
      }
    }

    warnings.push(...duplicateNodes);

    return warnings;
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
   * @param {string} classificationName The name of the classification to which the node belongs
   * @param {number} higher The parent id
   * @param {number} level The level in the hierarchy
   * @returns {string} The sql script
   */
  createInsertionSql(higher = null, level = 1) {
    if (!this.id || !this.classification) {
      throw new Error("A classification node must be linked to a classification");
    }

    const table = String(this.classification.name);

    const sql = queryFormat(`INSERT INTO ${table} VALUES (:id, :name, :higher, :level );`, {
      id: Number(this.id),
      name: String(this.name).substr(0, NODE_NAME_MAX_LENGTH),
      higher: Number(higher),
      level: Number(level),
    });

    return this.children.reduce(
      (sql, child) => `${sql} ${child.createInsertionSql(this.id, level + 1)}`,
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
   * @returns {MoleculesAnalyzerWarning|null} A warning or null
   */
  analyze() {
    /**
     * Checks that the node name is not too long
     * @returns
     */
    const isNameTooLong = () => {
      if (this.name.length > NODE_NAME_MAX_LENGTH) {
        return new MoleculesAnalyzerWarning(
          "TOO_LONG_CLASSIFICATION_VALUES",
          `La valeur de ${this.classification.name} "${this.name}" est trop longue (max ${NODE_NAME_MAX_LENGTH})`
        );
      }
      return false;
    };

    /**
     * Checks that the node name is a string
     * @returns
     */
    const isNameNotString = () => {
      if (!isString(this.name)) {
        return new MoleculesAnalyzerWarning(
          "INVALID_VALUE_TYPE",
          `La valeur de ${this.classification.name} "${this.name}" devrait être du texte`
        );
      }
      return false;
    };

    return isNameNotString() || isNameTooLong() || null;
  }
}
