import levenshtein from "js-levenshtein";

/**
 * Test if a variable if a string
 * @param {*} v
 * @returns {boolean}
 */
export const isString = (v) => typeof v === "string" || v instanceof String;

/**
 * Test if a variable if a number
 * @param {*} v
 * @returns {boolean}
 */
export const isNumber = (v) => typeof v === "number" || v instanceof Number;

/**
 * Returns values that appear more than once in the list
 * @param {any[]} values
 * @returns {any[]} duplicates values
 */
export function getDuplicates(values) {
  return [
    ...new Set(
      values.filter((value, i) =>
        values.slice(i + 1).find((other) => new RegExp(`^${value}$`, "i").test(other))
      )
    ),
  ];
}

/**
 * Returns all groups of values that have a distance less than a given one
 * @param {string[]} values The list of values
 * @param {number} maxDistance The maximum distance
 * @returns {string[][]}
 */
export function getTooCloseValues(values, maxDistance) {
  values = values.map((value) => (isString(value) ? value.toLowerCase() : value));
  const groups = [];

  values.forEach((value) => {
    if (!isString(value)) {
      return;
    }
    const group = values.filter((other) => {
      if (!isString(other)) {
        return;
      }
      const distance = levenshtein(other, value);
      return distance <= maxDistance && distance > 0;
    });

    const existingGroup = groups.find((egroup) => egroup.some((e) => group.includes(e)));
    if (existingGroup) {
      existingGroup.push(...group, value);
      return;
    }

    if (group.length > 0) {
      groups.push([...group, value]);
    }
  });

  return groups.map((group) => [...new Set(group)]);
}

/**
 * Filter values to keep too long ones
 * @param {any[]} values The list of values
 * @returns {any[]} The too long values
 */
export function getTooLongValues(values, maxLength) {
  return values.filter((value) => isString(value) && value.length > maxLength);
}
