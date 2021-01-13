/**
 * Class representing a classification node,
 * characterized by an identifier, a name and
 * consisting of a node that has child nodes.
 */
export class ClassificationNode {
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

// ***** EXPORTED FUNCTIONS *****

/**
 * Create a classification tree (not really a tree because we don't have a common root)
 * @param {string[][]} matrix
 * @return {ClassificationNode[]}
 */
function create(matrix) {
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
  return root.children;
}

/**
 * Find a node by its name in a classification and return its ID
 * @param {ClassificationNode[]} classification
 * @param {string} name
 * @return {null|number} Its id if found, null otherwise
 */
export function findId(classification, name) {
  if (!name) {
    return null;
  }
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

export default { create, findId };
