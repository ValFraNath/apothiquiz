import path from "path";

import { queryPromise } from "../db/database.js";
import { HeaderErrors } from "../global/csv_reader/HeaderChecker.js";
import { deleteFiles, moveFile, createDir, getSortedFiles } from "../global/files.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import Logger, { addErrorTitle } from "../global/Logger.js";
import { analyzeUsers } from "../global/users_importation/usersAnalyzer.js";
import { createSqlToInsertAllUsers } from "../global/users_importation/usersImporter.js";
import { parseUsersFromCsv } from "../global/users_importation/usersParser.js";

const FILES_DIR_PATH = path.resolve("files", "users");
const MAX_FILE_KEPT = 15;

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
    res.sendUsageError(400, "Invalid file format : must be csv ");
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
            createDir(FILES_DIR_PATH)
              .then(() =>
                moveFile(filepath, path.resolve(FILES_DIR_PATH, filename))
                  .then(() =>
                    getSortedFiles(FILES_DIR_PATH)
                      .then((files) =>
                        deleteFiles(
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

function getLastImportedUsers(req, _res) {
  const res = new HttpResponseWrapper(_res);

  getSortedFiles(FILES_DIR_PATH)
    .then((files) => {
      const last = files[0];

      res.sendResponse(200, {
        url: last ? `${req.protocol}://${req.get("host")}/api/v1/files/users/${last}` : null,
        shortpath: `/api/v1/files/users/${last}`,
        file: last,
      });
    })
    .catch(res.sendServerError);
}

export default { importUsers, getLastImportedUsers };
