import fs from "fs/promises";
import path from "path";

import { queryPromise } from "../db/database.js";
import { HeaderErrors } from "../global/csv_reader/HeaderChecker.js";
import { analyzeData } from "../global/data_analyzer/analyzer.js";
import { createSqlToInsertAllData } from "../global/data_importer/dataImporter.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import Logger, { addErrorTitle } from "../global/Logger.js";
import { parseMoleculesFromCsv } from "../global/molecules_parser/Parser.js";

function importMolecules(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const {
    _uploadedFileName: filename,
    _uploadedFileExtension: extension,
    _uploadedFileDirectory: directory,
    careAboutWarnings,
  } = req.body;

  if (extension !== "csv") {
    deleteFile(path.resolve(directory, filename))
      .catch(Logger.error)
      .then(() => res.sendUsageError(400, "Invalid file format : must be csv "));
    return;
  }

  parseMoleculesFromCsv(path.resolve(directory, filename))
    .then((json) => {
      const data = JSON.parse(json);
      const warnings = analyzeData(data);

      if (careAboutWarnings === "false") {
        moveFile(
          path.resolve(directory, filename),
          path.resolve("files", "molecules", `molecules_${filename}.${extension}`)
        )
          .then(() => {
            const sql = createSqlToInsertAllData(data);
            queryPromise(sql)
              .then(() => res.sendResponse(200, { message: "File imported", warnings }))
              .catch((error) => res.sendServerError(addErrorTitle(error, "Can't import data")));
          })
          .catch(res.sendServerError);
      } else {
        res.sendResponse(200, { message: "File tested but not imported", warnings });
        deleteFile(path.resolve(directory, filename)).catch(Logger.error);
      }
    })
    .catch((error) => {
      if (HeaderErrors.isInstance(error)) {
        return res.sendUsageError(400, { message: "Fichier mal formatté", errors: error.errors });
      }
      return res.sendServerError(error);
    });
}

function moveFile(oldFile, newFile) {
  return new Promise((resolve, reject) => {
    fs.rename(oldFile, newFile)
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't move the file")));
  });
}

function deleteFile(filename) {
  return new Promise((resolve, reject) => {
    fs.unlink(filename)
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't delete the file")));
  });
}

export default { importMolecules };
