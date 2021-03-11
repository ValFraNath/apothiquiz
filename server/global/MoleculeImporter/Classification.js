import { queryFormat } from "../../db/database.js";
import {
  MoleculesAnalyzerWarning,
  isString,
  getTooCloseValues,
  getDuplicates,
} from "../importationUtils.js";

const NODE_NAME_MAX_LENGTH = 128;

/**
 * Class representing a classification, used for molecules classes and systems
 */
export default class Classification {
  /**
   * Create a new classification
   * @param {string} name The classification name
   */
  constructor(name) {
    /** @type {string} The classificaion name */
    this.name = name;

    /** @type {ClassificationNode[]} The list of elements of the classification */
    this.elements = [];

    /** @type {number} The number of node in the classification */
    this.size = 0;

    this._bindNode = this._bindNode.bind(this);
  }

  /**
   *
   * @param {any[][]} matrix
   */
  static createFromMatrix(matrix, name) {
    const classification = new Classification(name);
    for (const row of matrix) {
      let parent = null;
      for (const value of row) {
        if (!value) return;

        const same = parent ? parent.getChildByName(value) : classification.getElementByName(value);
        if (same) {
          // console.log("same: ", value);
          parent = same;
        } else {
          // console.log("new: ", value);
          const newNode = new ClassificationNode(value);
          if (parent === null) {
            classification.addElements(newNode);
          } else {
            parent.addChild(newNode);
          }
          parent = newNode;
        }
      }
    }

    return classification;
  }

  /**
   * Bind a node and its children to this classification
   * @param {ClassificationNode} node The node
   */
  _bindNode(node) {
    if (node.id || node.classification) {
      throw new Error("The node is already bound to a classification");
    }
    node.id = ++this.size;
    node.classification = this;
    node.children.forEach((node) => this._bindNode(node));
  }

  /**
   * Add elements to the classification
   * @param  {...ClassificationNode} elements
   */
  addElements(...elements) {
    if (!elements.every((element) => element instanceof ClassificationNode)) {
      throw new Error("Elements of a classification must be classification nodes");
    }
    elements = elements.filter(
      ({ name }) => !this.elements.find((element) => element.name === name)
    );
    elements.forEach(this._bindNode);
    this.elements.push(...elements);
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

    const tooCloseNodeNames = getTooCloseValues(nodeNames).map(
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
   */
  constructor(name) {
    /** @type {number} The class id */
    this.id = null;

    /** @type {Classification} The classification to which the node belongs */
    this.classification = null;

    /** @type {string} The class name */
    this.name = name;

    /** @type {ClassificationNode[]} The class children */
    this.children = [];
  }

  /**
   * Add children to a class
   * @param  {...ClassificationNode} children
   */
  addChild(...children) {
    if (!children.every((child) => child instanceof ClassificationNode)) {
      throw new Error("Children of a classification node must be classification nodes");
    }

    children = children.filter(({ name }) => !this.children.find((child) => child.name === name));

    if (this.id && this.classification) {
      children.forEach((child) => this.classification._bindNode(child));
    }
    this.children.push(...children);
  }

  /**
   * Create the script to insert classification node (and its children !) in database
   * @param {string} classificationName The name of the classification to which the node belongs
   * @param {number} higher The parent id
   * @param {number} level The level in the hierarchy
   * @returns {string} The sql script
   */
  createInsertionSql(higher = null, level = 1) {
    if (!this.id) {
      throw new Error("A classification node must be linked to a classification");
    }

    const sql = queryFormat(
      `INSERT INTO ${this.classification.name} VALUES (:id, :name, :higher, :level );`,
      {
        id: this.id,
        name: this.name,
        higher,
        level,
      }
    );

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
   * Get the node analyzer
   * @returns {MoleculesAnalyzerWarning[]} The list of analyzer warnings
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
