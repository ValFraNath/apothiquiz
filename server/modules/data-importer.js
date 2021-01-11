import xlsx from "node-xlsx";

export function importData(filepath) {
  const data = Object.create(null);

  const excelData = readCsvFile(filepath);
  classificationsColumnIndexes(excelData.shift());

  data.systems = createClassification(extractColumns(excelData, 3, 5));
  data.classes = createClassification(extractColumns(excelData, 5, 8));

  return data;
}

function classificationsColumnIndexes(header) {
  const regexToProperties = {
    "SYSTEME_\\d+": "systems",
    "CLASSE_PHARMA_\\d+": "classes",
  };

  const propertiesToIndexes = Object.create(null);

  header.forEach((column, index) => {
    column = removeSuccessiveWhiteSpaces(column);
    if (!column) {
      return;
    }
    let value = Object.keys(regexToProperties).find((regex) =>
      new RegExp(regex).test(column)
    );
    if (value) {
      propertiesToIndexes[regexToProperties] = { begin: index, end: index };
    }
  });
}

function readCsvFile(filepath) {
  return xlsx
    .parse(filepath)[0]
    .data.filter((row) => removeSuccessiveWhiteSpaces(row[0]));
}

function extractColumns(array, begin = 0, end = array.length) {
  const res = [];
  array.forEach((row) => {
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

function removeSuccessiveWhiteSpaces(string = "") {
  return string.trim().replace(/\s+/g, " ");
}
