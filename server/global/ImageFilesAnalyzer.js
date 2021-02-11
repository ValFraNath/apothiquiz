/**
 *
 * @param {string[]} filenames
 */
function analyseImageFilenames(filenames) {
  return new Promise((resolve, reject) => {
    const normalizedFilenames = filenames.map(normalizeDCI);
  });
}

/**
 * Returns values that appear more than once in the list
 * @param {any[]} values
 * @returns {any[]} non-unique values
 */
function getDuplicates(values) {
  return [...new Set(values.filter((value, i) => values.slice(i + 1).includes(value)))];
}

const normalizeDCI = (str) =>
  str
    .trim()
    .normalize("NFD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/, "_");
