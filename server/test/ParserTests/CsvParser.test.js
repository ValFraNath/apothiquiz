import path from "path";
import chai from "chai";
import chaiHttp from "chai-http";
import mocha from "mocha";
const { before } = mocha;
import fs from "fs";

chai.use(chaiHttp);
const { expect } = chai;

import { parseCSV } from "../../modules/CSVParser/Parser.js";

const filesPath = path.resolve("test", "ParserTests", "CSVFiles");
const snapshotsPath = path.resolve("test", "ParserTests", "snapshots");

const files = [
  { name: "molecules.xlsx", snapshot: "molecules.json" },
  { name: "molecules_movedColumns.xlsx", snapshot: "molecules.json" },
];

function removeDuplications(array) {
  return [...new Set(array)];
}

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

function getMolecule(data, dci) {
  return data.molecules.find((m) => m.dci === dci);
}

function getClasse(data, name) {
  return flattenClassification(data.classes).find(
    (classe) => classe.name === name
  );
}

function getAllClasses(data, filter = identity) {
  return removeDuplications(flattenClassification(data.classes).map(filter));
}

function getAllSystems(data, filter = identity) {
  return removeDuplications(flattenClassification(data.systems).map(filter));
}

function expectMoleculeHaveClasse(data, molecule, classe) {
  molecule = getMolecule(data, molecule);
  classe = getClasse(data, classe);

  expect(molecule.classes).to.be.equals(classe.id);
}

const toId = (object) => object.id;
const toName = (object) => object.name;
const toDci = (molecule) => molecule.dci;
const identity = (e) => e;

for (let file of files) {
  describe(`The imported data contains the correct values : ${file.name}`, () => {
    let data;

    before("Import data", (done) => {
      data = JSON.parse(parseCSV(path.resolve(filesPath, file.name)));

      done();
    });

    it("Imported data are equals to expected data", function (done) {
      if (!file.snapshot) {
        this.skip();
      }
      let expectedData = fs.readFileSync(
        path.resolve(snapshotsPath, file.snapshot)
      );
      expect(data).to.be.deep.equals(JSON.parse(expectedData));
      done();
    });

    it("Systems", (done) => {
      expect(getAllSystems(data, toName)).to.have.length(4);
      expect(getAllSystems(data, toId)).to.have.length(4);

      expect(data.systems).to.have.length(1);
      expect(data.systems[0].children).to.have.length(3);
      expect(data.systems[0].name).to.be.equals("ANTIINFECTIEUX");

      done();
    });

    it("Classes", (done) => {
      const EXPECTED_NUMBER = 48;

      expect(getAllClasses(data, toName)).to.have.length(EXPECTED_NUMBER);
      expect(getAllClasses(data, toId)).to.have.length(EXPECTED_NUMBER);

      expect(data.classes).to.have.length(35);
      expect(data.classes[2].name).to.be.equals("ANALOGUES NUCLEOSIDIQUES");
      expect(data.classes[2].children).to.have.length(1);

      done();
    });

    it("Interactions", (done) => {
      const EXPECTED_NUMBER = 3;

      expect(Object.keys(data.interactions)).to.have.length(EXPECTED_NUMBER);
      expect(
        removeDuplications(Object.values(data.interactions))
      ).to.have.length(EXPECTED_NUMBER);

      done();
    });

    it("Indications", (done) => {
      const EXPECTED_NUMBER = 17;

      expect(Object.keys(data.indications)).to.have.length(EXPECTED_NUMBER);
      expect(
        removeDuplications(Object.values(data.indications))
      ).to.have.length(EXPECTED_NUMBER);

      done();
    });

    it("Side effects", (done) => {
      const EXPECTED_NUMBER = 10;

      expect(Object.keys(data.side_effects)).to.have.length(EXPECTED_NUMBER);
      expect(
        removeDuplications(Object.values(data.side_effects))
      ).to.have.length(EXPECTED_NUMBER);

      done();
    });

    it("Molecules : Intrinsic properties", (done) => {
      let zanamivir = getMolecule(data, "ZANAMIVIR");

      expect(removeDuplications(data.molecules.map(toDci))).to.have.length(140);
      expect(zanamivir.level_easy).to.be.equals(0);
      expect(zanamivir.level_hard).to.be.equals(1);

      done();
    });

    it("Molecules : Correct classes", (done) => {
      expectMoleculeHaveClasse(
        data,
        "PIVMECILLINAM",
        "PENICILLINES A LARGE SPECTRE"
      );
      expectMoleculeHaveClasse(
        data,
        "CEFEPIME",
        "CEPHALOSPORINE DE 3EME GENERATION"
      );
      expectMoleculeHaveClasse(data, "METHYLENECYCLINE", "TETRACYCLINES");

      done();
    });
  });
}
