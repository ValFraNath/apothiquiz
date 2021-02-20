import path from "path";

import { queryPromise } from "../db/database.js";
import { HeaderErrors } from "../global/csv_reader/HeaderChecker.js";
import { createDir, deleteFiles, getSortedFiles, moveFile } from "../global/files.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import { bindImagesToMolecules } from "../global/images_importation/imagesImporter.js";
import Logger, { addErrorTitle } from "../global/Logger.js";
import { analyzeData } from "../global/molecules_importation/moleculesAnalyzer.js";
import { createSqlToInsertAllData } from "../global/molecules_importation/moleculesImporter.js";
import { parseMoleculesFromCsv } from "../global/molecules_importation/moleculesParser.js";

const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";
const IMAGES_DIR = path.resolve(FILES_DIR, "molecules");
const MAX_FILE_KEPT = 15;

/**
 * @api {post} /import/molecules Import a csv file of molecules data
 * @apiName ImportMolecules
 * @apiGroup Import
 * 
 * @apiPermission LoggedIn
 * @apiPermission Admin
 * @apiDescription Import a csv file to update the molecules data; the format of the request must be multipart/form-data! 
 * 
 * @apiParam  {File} file The csv file
 * @apiParam {string} confirmed If "true", the data will be imported, otherwise they will be only tested
 * 
 * @apiSuccess (201 | 202) {string} message Message explaining what has been done
 * @apiSuccess (201 | 202) {object[]} warnings Array of warnings
 * @apiSuccess (201 | 202) {object} warnings.warning A warning
 * @apiSuccess (201 | 202) {number} warnings.warning.code The warning code
 * @apiSuccess (201 | 202) {string} warnings.warning.message The warning message
 * @apiSuccess (201 | 202) {boolean} imported Boolean telling if data are imported
 *
 * @apiSuccessExample Success-Response:
 *  {
      "message": "File tested but not imported",
      "warnings": [
        {
          "code": 3,
          "message": "Ces valeurs de \"classes\" sont très proches : \"PENICILLINES A\", \"PENICILLINES\""
        },
        {
          "code": 3,
          "message": "Ces valeurs de \"indications\" sont très proches : \"VIH\", \"VHB\""
        }
      ],
      "imported": false
    }
  
 * @apiError (422) BadFormattedFile The csv file is badly formatted
 * @apiErrorExample BadlyFormattedFile Error-Response:
    {
      "message": "Badly formatted file",
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
 * @apiError (400) BadFileType The file is not csv
 * @apiError (400) MissingFile No file provided
 * @apiErrorExample 400 Error-Response:
  {
    "message" : "Fichier manquant"
  }
 * @apiUse ErrorServer
 *
 */
function importMolecules(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const { confirmed } = req.body;

  if (!req.file) {
    return res.sendUsageError(400, "Missing file");
  }

  const { path: filepath, filename, originalname } = req.file;

  const deleteUploadedFile = () => deleteFiles(filepath).catch(Logger.error);

  const sendServorError = (error, title) => {
    res.sendServerError(addErrorTitle(error, title));
    deleteUploadedFile();
  };

  if (!/\.csv$/i.test(originalname)) {
    res.sendUsageError(400, "Invalid file format : must be csv ");
    deleteUploadedFile();
    return;
  }

  let imported = false;
  parseMoleculesFromCsv(filepath)
    .then((json) => {
      const data = JSON.parse(json);

      if (confirmed === "true") {
        const sql = createSqlToInsertAllData(data);
        queryPromise(sql)
          .then(() =>
            bindAlreadyExistingImages()
              .then(() =>
                createDir(IMAGES_DIR)
                  .then(() =>
                    moveFile(filepath, path.resolve(IMAGES_DIR, filename))
                      .then(() =>
                        getSortedFiles(IMAGES_DIR)
                          .then((files) =>
                            deleteFiles(
                              ...files.slice(MAX_FILE_KEPT).map((file) => `${IMAGES_DIR}/${file}`)
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
        res.sendUsageError(422, "Badly formatted file", {
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
 * @apiName GetLastImportedMolecules
 * @apiGroup Import
 * @apiPermission LoggedIn 
 * @apiPermission Admin 
 *
 * @apiSuccess (200) {string} url The url to the file
 * @apiSuccess (200) {string} shortpath The path to the file in the server
 * @apiSuccess (200) {string} file The file name
 *
 *
 * @apiSuccessExample Success-Response:
 *  {
      "url": "https://glowing-octo-guacamole.com/files/molecules/molecules_1612279095021.csv",
      "shortpath" : "/files/molecules/molecules_1612279095021.csv",
      "file" : "molecules_1612279095021.csv"
    }
 *
 *
 */
function getLastImportedFile(req, _res) {
  const res = new HttpResponseWrapper(_res);
  getSortedFiles(IMAGES_DIR)
    .then((files) => {
      const last = files[0];

      res.sendResponse(200, {
        url: last ? `${req.protocol}://${req.get("host")}/api/v1/files/molecules/${last}` : null,
        shortpath: `/api/v1/files/molecules/${last}`,
        file: last,
      });
    })
    .catch(res.sendServerError);
}

export default { importMolecules, getLastImportedFile };

// ****** INTERNAL FUNCTIONS ******

/**
 * Make sure molecules with an image before import always have one after
 * @returns {Promise}
 */
function bindAlreadyExistingImages() {
  return new Promise((resolve, reject) => {
    getSortedFiles(path.resolve(FILES_DIR, "images"))
      .then((images) => bindImagesToMolecules(images).then(() => resolve()))
      .catch(reject);
  });
}
