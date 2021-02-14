import levenshtein from "js-levenshtein";

import { MAX_LENGTHS } from "./moleculesImporter.js";

const DCI_DISTANCE_MIN = 1;
const PROPERTY_VALUE_MIN_DISTANCE = 2;
const CLASSIFICATION_VALUE_MIN_DISTANCE = 2;

/**
 * Analyse the data object and returns warnings
 * @param {object} data
 * @returns {MoleculesAnalyzerWarning[]}
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
 * @returns {MoleculesAnalyzerWarning[]}
 */
function analyzeProperty(property, values) {
  const names = values.map((v) => v.name);
  const tooLongValues = getTooLongValues(names, MAX_LENGTHS.PROPERTY_VALUE);
  const closeValues = getTooCloseValues(names, PROPERTY_VALUE_MIN_DISTANCE);
  const noStringValue = names.filter((name) => !isString(name));

  return [
    ...tooLongValues.map(
      (value) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.TOO_LONG_VALUE,
          `La valeur "${value}" de la propriété "${property}" est trop longue (max ${MAX_LENGTHS.PROPERTY_VALUE})`
        )
    ),
    ...closeValues.map(
      (group) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.TOO_CLOSE_VALUES,
          `Ces valeurs de "${property}" sont très proches : "${group.join('", "')}"`
        )
    ),
    ...noStringValue.map(
      (value) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.INVALID_TYPE,
          `Une valeur de "${property}" devrait être une chaine de caractères : "${value}"`
        )
    ),
  ];
}

/**
 * Analyze a classification
 * @param {string} classification The classification name
 * @param {object[]} nodes The classification node
 * @returns {MoleculesAnalyzerWarning[]}
 */
function analyzeClassification(classification, nodes) {
  const names = flattenClassification(nodes).map((n) => n.name);
  const closeValues = getTooCloseValues(names, CLASSIFICATION_VALUE_MIN_DISTANCE);
  const tooLongValues = getTooLongValues(names, MAX_LENGTHS.CLASSIFICATION_VALUE);
  const nodesHavingSeveralParents = findNodeWithDifferentsParents(nodes);
  const noStringValue = names.filter((name) => !isString(name));

  return [
    ...closeValues.map(
      (group) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.TOO_CLOSE_VALUES,
          `Ces valeurs de "${classification}" sont très proches : "${group.join('", "')}"`
        )
    ),
    ...nodesHavingSeveralParents.map(
      (node) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE,
          `La valeur de "${classification}" "${
            node.node
          }" apparait plusieurs fois dans la hiérarchie, enfant de : "${node.parents.join('", "')}"`
        )
    ),
    ...tooLongValues.map(
      (value) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.TOO_LONG_VALUE,
          `La valeur de "${classification}" "${value}" est trop longue (max ${MAX_LENGTHS.CLASSIFICATION_VALUE})`
        )
    ),
    ...noStringValue.map(
      (value) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.INVALID_TYPE,
          `Une valeur de "${classification}" devrait être une chaîne de caractères : "${value}"`
        )
    ),
  ];
}

/**
 * Analyze a molecule list
 * @param {object[]} molecules The molecules list
 * @returns {MoleculesAnalyzerWarning[]}
 */
function analyzeMolecules(molecules) {
  const dciList = molecules.map((m) => m.dci);
  const duplicates = getDuplicates(dciList);
  const closeNames = getTooCloseValues(dciList, DCI_DISTANCE_MIN);
  const tooLongNames = getTooLongValues(dciList, MAX_LENGTHS.DCI);
  const nonValidNumberValues = getNonValidNumberValue(molecules);
  const invalidDcis = getInvalidNormalizedDci(dciList);

  return [
    ...invalidDcis.map(
      (dci) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.INVALID_DCI,
          `Molécule invalide : "${dci}" `
        )
    ),
    ...duplicates.map(
      (mol) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE,
          `Duplications de la molécule "${mol}"`
        )
    ),
    ...closeNames.map(
      (group) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.TOO_CLOSE_VALUES,
          `Ces molécules ont une DCI très proche : "${group.join('", "')}"`
        )
    ),
    ...tooLongNames.map(
      (dci) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.TOO_LONG_VALUE,
          `La DCI "${dci}" est trop longue (max ${MAX_LENGTHS.DCI})`
        )
    ),
    ...nonValidNumberValues.map(
      (value) =>
        new MoleculesAnalyzerWarning(
          MoleculesAnalyzerWarning.INVALID_TYPE,
          `La propriété "${value.property}" de la molécule "${value.molecule}" devrait être un nombre compris entre 0 et 1 : "${value.value}"`
        )
    ),
  ];
}

/**
 * Get all invalid value of number property
 * @param {object[]} molecules The molecule list
 * @returns {{molecule : string, property : string, value : string}[]}
 */
function getNonValidNumberValue(molecules) {
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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();

/**
 * Get all invalid normalized dci
 * @param {string[]} molecules The molecule's dci
 */
export function getInvalidNormalizedDci(molecules) {
  return molecules.map(normalizeDCI).filter((dci) => !/^[a-z_]+$/i.test(dci));
}

export class MoleculesAnalyzerWarning {
  constructor(code, message) {
    this.code = code;
    this.message = message;
  }
}

MoleculesAnalyzerWarning.DUPLICATE_UNIQUE_VALUE = 1;
MoleculesAnalyzerWarning.TOO_LONG_VALUE = 2;
MoleculesAnalyzerWarning.TOO_CLOSE_VALUES = 3;
MoleculesAnalyzerWarning.DUPLICATE_CLASSIFICATION_NODE = 4;
MoleculesAnalyzerWarning.INVALID_TYPE = 5;
MoleculesAnalyzerWarning.INVALID_DCI = 6;

/**
 * Returns values that appear more than once in the list
 * @param {any[]} values
 * @returns {any[]} non-unique values
 */
function getDuplicates(values) {
  return [...new Set(values.filter((value, i) => values.slice(i + 1).includes(value)))];
}

/**
 * Get all values which are longer that the max length
 * @param {string[]} values
 * @param {number} maxlength
 * @returns {string[]} The list a too long values
 */
function getTooLongValues(values, maxlength) {
  return values.filter((value) => value.length > maxlength);
}

/**
 * Returns all groups of values that have a distance less than a given one
 * @param {string[]} values The values
 * @param {number} minDistance The maximum distance
 * @returns {string[][]}
 */
function getTooCloseValues(values, minDistance) {
  values = values.slice();
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
      return distance <= minDistance && distance > 0;
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

const isString = (v) => typeof v === "string" || v instanceof String;
const isNumber = (v) => typeof v === "number" || v instanceof Number;
