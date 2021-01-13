/**
 * Create a property, i.e. a set of value characterized by an ID
 * @param {string[][]} matrix
 * @return {{id : number,name : string}[]}
 */
function create(matrix) {
  const values = [];
  let id = 1;

  matrix.forEach((row) => {
    row.forEach((value) => {
      if (!values[value]) {
        if (!findId(values, value)) {
          values.push({ id: id++, name: value });
        }
      }
    });
  });
  return values;
}

/**
 * Find a property value by its name
 * and returns its ID.
 * @param {{id : number,name : string}[]} property
 * @param {string} name
 * @return {number|null}
 */
function findId(property, name) {
  if (!name) {
    return null;
  }
  const value = property.find((value) => value.name === name);
  if (value) {
    return value.id;
  }
  return null;
}

export default { create, findId };
