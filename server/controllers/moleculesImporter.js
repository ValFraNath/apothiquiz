import fs from "fs/promises";
import path from "path";

import { queryPromise } from "../db/database.js";
import { HeaderErrors } from "../global/csv_reader/HeaderChecker.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import Logger, { addErrorTitle } from "../global/Logger.js";
import { analyzeData } from "../global/molecules_analyzer/moleculesAnalyzer.js";
import { createSqlToInsertAllData } from "../global/molecules_importer/moleculesImporter.js";
import { parseMoleculesFromCsv } from "../global/molecules_parser/Parser.js";

/**
 *
 * @api {post} /import/molecules Import a csv file of molecules data
 * @apiName ImportMolecules
 * @apiGroup Import
 * 
 * @apiPermission LoggedIn
 * @apiPermission Admin
 * @apiDescription Import a csv file to update the molecules data, the format of the request must be multipart/form-data ! 
 * 
 * @apiParam  {File} file The csv file
 * @apiParam {string} careAboutWarnings If "false", the data will be imported even if there are warnings
 * 
 * @apiSuccess (200) {string} message Message explaining what was done
 * @apiSuccess (200) {object[]} warnings Array of warnings
 * @apiSuccess (200) {object} warnings.warning a warning
 * @apiSuccess (200) {number} warnings.warning.code The warning code
 * @apiSuccess (200) {string} warnings.warning.message The warning message
 * @apiSuccess (200) {boolean} imported Boolean telling if data are imported
 *
 * @apiSuccessExample Success-Response:
 *  {
      "message": "File tested but not imported",
      "warnings": [
        {
          "type": 3,
          "message": "Ces valeurs de \"classes\" sont très proches : \"PENICILLINES A\", \"PENICILLINES\""
        },
        {
          "type": 3,
          "message": "Ces valeurs de \"indications\" sont très proches : \"VIH\", \"VHB\""
        }
      ],
      "imported": false
    }
  
 * @apiError (400) BadFormattedFile The csv file is bad formatted
 * @apiErrorExample BadFormattedFile Error-Response:
    {
      "message": {
        "message": "Bad formatted file",
        "errors": [
          {
            "code": 1,
            "message": "Colonne manquante : 'FORMULE_CHIMIQUE'"
          },
          {
            "code": 4,
            "message": "Colonne invalide : 'INDICATIO' (col. 10)"
          },
          {
            "code": 4,
            "message": "Colonne invalide : 'FORMULE CHIMIQUE' (col. 19)"
          }
        ],
        "imported": false
      }
    }   
 * @apiError (400) BadFileType The file is not csv
 * @apiError (400) MissingFile No file provided
 * @apiUse ErrorServer
 *
 */
function importMolecules(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const {
    _uploadedFileName: filename,
    _uploadedFileExtension: extension,
    _uploadedFileDirectory: directory,
    careAboutWarnings,
  } = req.body;

  if (!filename) {
    return res.sendUsageError(400, "Missing file");
  }

  const deleteUploadedFile = () =>
    deleteFile(path.resolve(directory, filename)).catch(Logger.error);

  if (extension !== "csv") {
    res.sendUsageError(400, "Invalid file format : must be csv ");
    deleteUploadedFile();
    return;
  }

  let imported = false;
  parseMoleculesFromCsv(path.resolve(directory, filename))
    .then((json) => {
      const data = JSON.parse(json);

      if (careAboutWarnings === "false") {
        const sql = createSqlToInsertAllData(data);
        queryPromise(sql)
          .then(() =>
            createDir(path.resolve("files", "molecules"))
              .then(() =>
                moveFile(
                  path.resolve(directory, filename),
                  path.resolve("files", "molecules", `molecules_${filename}.${extension}`)
                )
                  .then(() =>
                    res.sendResponse(200, {
                      message: "File imported",
                      warnings: [],
                      imported: true,
                    })
                  )
                  .catch((error) => {
                    res.sendServerError(error);
                    deleteUploadedFile();
                  })
              )
              .catch((error) => {
                res.sendServerError(addErrorTitle(error, "Can't import data"));
                deleteUploadedFile();
              })
          )
          .catch((error) => {
            res.sendServerError(addErrorTitle(error, "Can't insert new molecules"));
            deleteUploadedFile();
          });
      } else {
        const warnings = analyzeData(data);
        res.sendResponse(200, {
          message: "File tested but not imported",
          warnings,
          imported,
        });
        deleteUploadedFile();
      }
    })
    .catch((error) => {
      if (HeaderErrors.isInstance(error)) {
        return res.sendUsageError(400, {
          message: "Bad formatted file",
          errors: error.errors,
          imported,
        });
      }
      deleteUploadedFile();
      return res.sendServerError(error);
    });
}

/**
 *
 * @api {get} /import/molecules Get the last imported file
 * @apiName GetLastImported
 * @apiGroup Import
 * @apiPermissions LoggedIn 
 * @apiPermissions Admin 
 *
 * @apiSuccess (200) {string} file The url to the file
 *
 *
 * @apiSuccessExample Success-Response:
 *  {
      "file": "https://glowing-octo-guacamole.com/api/v1/molecules/molecules_1612279095021.csv"
    }
 *
 *
 */
function getLastImportedFile(req, _res) {
  const res = new HttpResponseWrapper(_res);
  getFiles(path.resolve("files", "molecules"))
    .then((files) => {
      const last = files.reduce(
        ({ filename, time }, file) => {
          const fileTime = Number(file.split("_")[1].split(".")[0]);
          if (time < fileTime) {
            filename = file;
            time = fileTime;
          }
          return { filename, time };
        },
        { filename: null, time: 0 }
      ).filename;

      res.sendResponse(200, {
        file: last ? `${req.protocol}://${req.get("host")}/molecules/${last}` : null,
      });
    })
    .catch(res.sendServerError);
}

export default { importMolecules, getLastImportedFile };

// ********* INTERNAL FUNCTIONS *********

/**
 * Move a file
 * @param {string} oldPath
 * @param {string} newPath
 * @return {Promise}
 */
function moveFile(oldPath, newPath) {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath)
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't move the file")));
  });
}

/**
 * Delete a file
 * @param {string} filename
 * @returns {Promise}
 */
function deleteFile(filename) {
  return new Promise((resolve, reject) => {
    fs.unlink(filename)
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't delete the file")));
  });
}

/**
 * Create a directory if it does not exist
 * @param {string} dirname
 * @return {Promise}
 */
function createDir(dirname) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirname)
      .then(resolve)
      .catch((error) => {
        if (error.code === "EEXIST") {
          resolve();
        } else {
          reject(error);
        }
      });
  });
}

function getFiles(dirpath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirpath)
      .then((files) => {
        console.log(files);
        resolve(files);
      })
      .catch((error) => {
        if (error.code === "ENOENT") {
          resolve([]);
        }
        reject(addErrorTitle(error, "Can't read the directory"));
      });
  });
}
