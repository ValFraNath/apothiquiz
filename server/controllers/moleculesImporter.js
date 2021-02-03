import fs from "fs/promises";
import path from "path";

import { queryPromise } from "../db/database.js";
import { HeaderErrors } from "../global/csv_reader/HeaderChecker.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import Logger, { addErrorTitle } from "../global/Logger.js";
import { analyzeData } from "../global/molecules_analyzer/moleculesAnalyzer.js";
import { createSqlToInsertAllData } from "../global/molecules_importer/moleculesImporter.js";
import { parseMoleculesFromCsv } from "../global/molecules_parser/Parser.js";

const FILES_DIR_PATH = path.resolve("files", "molecules");
const MAX_FILE_KEPT = 15;

/**
 * @api {post} /import/molecules Import a csv file of molecules data
 * @apiName ImportMolecules
 * @apiGroup Import
 * 
 * @apiPermission LoggedIn
 * @apiPermission Admin
 * @apiDescription Import a csv file to update the molecules data; the format of the request must be multipart/form-data ! 
 * 
 * @apiParam  {File} file The csv file
 * @apiParam {string} confirmed If "true", the data will be imported, otherwise they will be only tested
 * 
 * @apiSuccess (200) {string} message Message explaining what was done
 * @apiSuccess (200) {object[]} warnings Array of warnings
 * @apiSuccess (200) {object} warnings.warning A warning
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
    confirmed,
  } = req.body;

  if (!filename) {
    return res.sendUsageError(400, "Missing file");
  }

  const deleteUploadedFile = () =>
    deleteFile(path.resolve(directory, filename)).catch(Logger.error);

  const sendServorError = (error, title) => {
    res.sendServerError(addErrorTitle(error, title));
    deleteUploadedFile();
  };

  if (extension !== "csv") {
    res.sendUsageError(400, "Invalid file format : must be csv ");
    deleteUploadedFile();
    return;
  }

  let imported = false;
  parseMoleculesFromCsv(path.resolve(directory, filename))
    .then((json) => {
      const data = JSON.parse(json);

      if (confirmed === "true") {
        const sql = createSqlToInsertAllData(data);
        queryPromise(sql)
          .then(() =>
            createDir(FILES_DIR_PATH)
              .then(() =>
                moveFile(
                  path.resolve(directory, filename),
                  path.resolve("files", "molecules", `molecules_${filename}.${extension}`)
                )
                  .then(() =>
                    getSortedFiles(FILES_DIR_PATH)
                      .then((files) =>
                        deleteFile(
                          ...files.slice(MAX_FILE_KEPT).map((file) => `${FILES_DIR_PATH}/${file}`)
                        )
                          .then(() =>
                            res.sendResponse(201, {
                              message: "File imported",
                              warnings: [],
                              imported: true,
                            })
                          )
                          .catch(sendServorError)
                      )
                      .catch(sendServorError)
                  )
                  .catch(sendServorError)
              )
              .catch(sendServorError)
          )
          .catch(sendServorError);
      } else {
        const warnings = analyzeData(data);
        res.sendResponse(202, {
          message: "File tested but not imported",
          warnings,
          imported,
        });
        deleteUploadedFile();
      }
    })
    .catch((error) => {
      if (HeaderErrors.isInstance(error)) {
        res.sendUsageError(400, "Bad formatted file", {
          errors: error.errors,
          imported,
        });
      } else {
        res.sendServerError(error);
      }
      deleteUploadedFile();
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
  getSortedFiles(path.resolve("files", "molecules"))
    .then((files) => {
      const last = files[0];

      res.sendResponse(200, {
        fullpath: last ? `${req.protocol}://${req.get("host")}/molecules/${last}` : null,
        shortpath: `/molecules/${last}`,
        file: last,
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
function deleteFile(...filenames) {
  return new Promise((resolve, reject) => {
    Promise.all(
      filenames.map((filename) => {
        fs.unlink(filename);
      })
    )
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't delete files")));
  });
}

/**
 * Create a directory if it does not exist
 * @param {string} dirname
 * @return {Promise}
 */
function createDir(dirname) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirname, { recursive: true })
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't create the directory")));
  });
}

function getSortedFiles(dirpath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirpath)
      .then((files) => {
        resolve(files.sort().reverse());
      })
      .catch((error) => {
        if (error.code === "ENOENT") {
          resolve([]);
        }
        reject(addErrorTitle(error, "Can't read the directory"));
      });
  });
}
