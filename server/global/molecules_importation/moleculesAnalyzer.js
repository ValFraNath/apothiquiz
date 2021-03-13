import {
  isString,
  isNumber,
  getDuplicates,
  getTooLongValues,
  getTooCloseValues,
  AnalyzerWarning,
} from "../importationUtils.js";

import { MOLECULES_MAX_LENGTHS } from "./moleculesImporter.js";

const DCI_DISTANCE_MIN = 1;
const PROPERTY_VALUE_MIN_DISTANCE = 2;
const CLASSIFICATION_VALUE_MIN_DISTANCE = 2;

/**
 * Analyse the data object and returns warnings
 * @param {object} data
 * @returns {AnalyzerWarning[]}
 */
export function analyzeData(data) {
  const warnings = [];

  warnings.push(...analyzeClassification("classes", data.classes));
  warnings.push(...analyzeClassification("systèmes", data.systems));

  warnings.push(...analyzeProperty("indications", data.indications, 128));
  warnings.push(...analyzeProperty("effets indésirables", data.sideEffects, 128));
  warnings.push(...analyzeProperty("intéractions", data.interactions, 128));

  warnings.push(...analyzeMolecules(data.molecules));

  return warnings;
}

/**
 * Analyze a property
 * @param {string} property The property name
 * @param {{id : number, name : string}[]} values
 * @returns {AnalyzerWarning[]}
 */
function analyzeProperty(property, values) {
  const names = values.map((v) => v.name);
  const tooLongValues = getTooLongValues(names, MOLECULES_MAX_LENGTHS.PROPERTY_VALUE);
  const closeValues = getTooCloseValues(names, PROPERTY_VALUE_MIN_DISTANCE);
  const noStringValue = names.filter((name) => !isString(name));

  return [
    ...tooLongValues.map(
      (value) =>
        new AnalyzerWarning(
          AnalyzerWarning.TOO_LONG_VALUE,
          `La valeur "${value}" de la propriété "${property}" est trop longue (max ${MOLECULES_MAX_LENGTHS.PROPERTY_VALUE})`
        )
    ),
    ...closeValues.map(
      (group) =>
        new AnalyzerWarning(
          AnalyzerWarning.TOO_CLOSE_VALUES,
          `Ces valeurs de "${property}" sont très proches : "${group.join('", "')}"`
        )
    ),
    ...noStringValue.map(
      (value) =>
        new AnalyzerWarning(
          AnalyzerWarning.INVALID_TYPE,
          `Une valeur de "${property}" devrait être une chaine de caractères : "${value}"`
        )
    ),
  ];
}

/**
 * Analyze a classification
 * @param {string} classification The classification name
 * @param {object[]} nodes The classification node
 * @returns {AnalyzerWarning[]}
 */
function analyzeClassification(classification, nodes) {
  const names = flattenClassification(nodes).map((n) => n.name);
  const closeValues = getTooCloseValues(names, CLASSIFICATION_VALUE_MIN_DISTANCE);
  const tooLongValues = getTooLongValues(names, MOLECULES_MAX_LENGTHS.CLASSIFICATION_VALUE);
  const nodesHavingSeveralParents = findNodeWithDifferentsParents(nodes);
  const noStringValue = names.filter((name) => !isString(name));

  return [
    ...closeValues.map(
      (group) =>
        new AnalyzerWarning(
          AnalyzerWarning.TOO_CLOSE_VALUES,
          `Ces valeurs de "${classification}" sont très proches : "${group.join('", "')}"`
        )
    ),
    ...nodesHavingSeveralParents.map(
      (node) =>
        new AnalyzerWarning(
          AnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE,
          `La valeur de "${classification}" "${
            node.node
          }" apparait plusieurs fois dans la hiérarchie, enfant de : "${node.parents.join('", "')}"`
        )
    ),
    ...tooLongValues.map(
      (value) =>
        new AnalyzerWarning(
          AnalyzerWarning.TOO_LONG_VALUE,
          `La valeur de "${classification}" "${value}" est trop longue (max ${MOLECULES_MAX_LENGTHS.CLASSIFICATION_VALUE})`
        )
    ),
    ...noStringValue.map(
      (value) =>
        new AnalyzerWarning(
          AnalyzerWarning.INVALID_TYPE,
          `Une valeur de "${classification}" devrait être une chaîne de caractères : "${value}"`
        )
    ),
  ];
}

/**
 * Analyze a molecule list
 * @param {object[]} molecules The molecules list
 * @returns {AnalyzerWarning[]}
 */
function analyzeMolecules(molecules) {
  const dciList = molecules.map((m) => m.dci);
  const duplicates = getDuplicates(dciList);
  const closeNames = getTooCloseValues(dciList, DCI_DISTANCE_MIN);
  const tooLongNames = getTooLongValues(dciList, MOLECULES_MAX_LENGTHS.DCI);
  const nonValidNumberValues = getNonValidNumberValues(molecules);
  const invalidDcis = getInvalidNormalizedDci(dciList);

  return [
    ...invalidDcis.map(
      (dci) => new AnalyzerWarning(AnalyzerWarning.INVALID_DCI, `Molécule invalide : "${dci}" `)
    ),
    ...duplicates.map(
      (mol) =>
        new AnalyzerWarning(
          AnalyzerWarning.DUPLICATE_UNIQUE_VALUE,
          `Duplications de la molécule "${mol}"`
        )
    ),
    ...closeNames.map(
      (group) =>
        new AnalyzerWarning(
          AnalyzerWarning.TOO_CLOSE_VALUES,
          `Ces molécules ont une DCI très proche : "${group.join('", "')}"`
        )
    ),
    ...tooLongNames.map(
      (dci) =>
        new AnalyzerWarning(
          AnalyzerWarning.TOO_LONG_VALUE,
          `La DCI "${dci}" est trop longue (max ${MOLECULES_MAX_LENGTHS.DCI})`
        )
    ),
    ...nonValidNumberValues.map(
      (value) =>
        new AnalyzerWarning(
          AnalyzerWarning.INVALID_TYPE,
          `La propriété "${value.property}" de la molécule "${value.molecule}" devrait être un nombre compris entre 0 et 1 : "${value.value}"`
        )
    ),
  ];
}

/**
 * Get all invalid values of number property
 * @param {object[]} molecules The molecule list
 * @returns {{molecule : string, property : string, value : string}[]}
 */
function getNonValidNumberValues(molecules) {
  return molecules.reduce(
    (noNumberValues, molecule) =>
      ["levelEasy", "levelHard", "ntr"].reduce((noNumberValues, prop) => {
        const value = molecule[prop];
        if (value !== null && (!isNumber(value) || value < 0 || value > 1)) {
          noNumberValues.push({ molecule: molecule.dci, property: prop, value });
        }
        return noNumberValues;
      }, noNumberValues),
    []
  );
}

/**
 * Normalize a molecule DCI
 * @param {string} dci
 */
export const normalizeDCI = (dci) =>
  String(dci)
    .trim()
    .normalize("NFD") // The unicode normal form decomposes the combined graphemes into a combination of simple graphemes. 'è' => 'e' + '`'
    .replace(/[\u0300-\u036f]/g, "") // Remove all special graphemes : 'e' + '`' => 'e'
    .replace(/[\s-']+/g, "_")
    .toLowerCase();

/**
 * Get all invalid normalized dci
 * @param {string[]} molecules The molecule's dci
 */
export function getInvalidNormalizedDci(molecules) {
  return molecules.map(normalizeDCI).filter((dci) => !/^[a-z_]+$/i.test(dci));
}

/**
 * Find nodes with the same name but a different parent
 * @param {object[]} classification The set of nodes
 * @returns {{node : string, parents : string[]}[]}
 */
function findNodeWithDifferentsParents(classification) {
  classification = flattenClassification(classification);
  const groups = [];
  classification.forEach((node, i) => {
    if (!node) {
      return;
    }

    const isDuplicated = classification
      .slice(i + 1)
      .find((other) => other && node.name === other.name);

    if (isDuplicated) {
      const parents = classification
        .filter((n) => n && n.children.find((n) => n.name === node.name))
        .map((p) => p.name);

      groups.push({ node: node.name, parents });
      classification = classification.map((n) => (n && n.name === node.name ? null : n));
    }
  });
  return groups;
}

/**
 * Return an array of all node of all level of a classification
 * @param {ClassificationNode[]} classification
 * @returns {ClassificationNode[]}
 */
function flattenClassification(classification) {
  function flattenNode(node) {
    let res = [node];
    for (let child of node.children) {
      res.push(...flattenNode(child));
    }
    return res;
  }

  const res = [];
  for (let node of classification) {
    res.push(...flattenNode(node));
  }
  return res;
}
