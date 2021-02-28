import path from "path";

import { queryPromise } from "../db/database.js";
import { HeaderErrors } from "../global/csv_reader/HeaderChecker.js";
import { deleteFiles, moveFile, createDir, getSortedFiles } from "../global/files.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import Logger, { addErrorTitle } from "../global/Logger.js";
import { analyzeUsers } from "../global/users_importation/usersAnalyzer.js";
import { createSqlToInsertAllUsers } from "../global/users_importation/usersImporter.js";
import { parseUsersFromCsv } from "../global/users_importation/usersParser.js";

const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";
const USERS_DIR = path.resolve(FILES_DIR, "users");
const MAX_FILE_KEPT = 15;

/**
 * @api {post} /import/users Import a csv file of users
 * @apiName ImportUsers
 * @apiGroup Import
 * 
 * @apiPermission LoggedIn
 * @apiPermission Admin
 * @apiDescription Import a csv file to update the users list; the format of the request must be multipart/form-data! 
 * 
 * @apiParam  {File} file The csv file
 * @apiParam {string} confirmed If "true", the users will be imported, otherwise they will be only tested
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
          "code": 5,
          "message": "Aucun utilisateur n'est désigné comme admin"
        },
        {
          "code": 1,
          "message": "Duplication du login \"mpudlo\""
        },
      ],
      "imported": false
    }
  
 * @apiError (422) BadFormattedFile The csv file is badly formatted  
 * @apiError (400) BadFileType The file is not csv
 * @apiError (400) MissingFile No file provided
 * @apiErrorExample 400 Error-Response:
  {
    "message" : "Fichier manquant"
  }
 * @apiUse ErrorServer
 *
 */
function importUsers(req, _res) {
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
    res.sendUsageError(400, "Invalid file format: must be csv ");
    deleteUploadedFile();
    return;
  }

  let imported = false;
  parseUsersFromCsv(filepath)
    .then((json) => {
      const data = JSON.parse(json);

      if (confirmed === "true") {
        const insertionScript = createSqlToInsertAllUsers(data);
        queryPromise(insertionScript)
          .then(() =>
            createDir(USERS_DIR)
              .then(() =>
                moveFile(filepath, path.resolve(USERS_DIR, filename))
                  .then(() =>
                    getSortedFiles(USERS_DIR)
                      .then((files) =>
                        deleteFiles(
                          ...files.slice(MAX_FILE_KEPT).map((file) => `${USERS_DIR}/${file}`)
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
        const warnings = analyzeUsers(data);
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
 * @api {get} /import/users Get the last imported users
 * @apiName GetLastImportedUsers
 * @apiGroup Import
 * @apiPermission LoggedIn 
 * @apiPermission Admin 
 *
 * @apiSuccess (200) {string} url The url to the file
 * @apiSuccess (200) {string} shortpath The path to the file in the server
 * @apiSuccess (200) {string} file The file name
 * @apiError (404) NoImportedFile No file was previously imported
 *
 * @apiSuccessExample Success-Response:
 *  {
      "url": "https://guacamole.com/files/molecules/molecules_1612279095021.csv",
      "shortpath" : "/files/molecules/molecules_1612279095021.csv",
      "file" : "molecules_1612279095021.csv"
    }
 *
 *
 */
function getLastImportedUsers(req, _res) {
  const res = new HttpResponseWrapper(_res);

  getSortedFiles(USERS_DIR)
    .then((files) => {
      const last = files[0];

      if (!last) {
        return res.sendUsageError(404, "Aucun utilisateur n'a déjà été importé");
      }

      res.sendResponse(200, {
        url: `${req.protocol}://${req.get("host")}/api/v1/files/users/${last}`,
        shortpath: `/api/v1/files/users/${last}`,
        file: last,
      });
    })
    .catch(res.sendServerError);
}

export default { importUsers, getLastImportedUsers };
