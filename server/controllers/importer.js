import fs from "fs/promises";
import path from "path";

import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import Logger, { addErrorTitle } from "../global/Logger.js";

function importMolecules(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const {
    _uploadedFileName: filename,
    _uploadedFileExtension: extension,
    _uploadedFileDirectory: directory,
  } = req.body;

  if (extension !== "csv") {
    deleteFile(path.resolve(directory, filename))
      .catch(Logger.error)
      .then(() => res.sendUsageError(400, "Invalid file format : must be csv "));
    return;
  }

  moveFile(
    path.resolve(directory, filename),
    path.resolve("files", "molecules", `${filename}.${extension}`)
  )
    .then(() => res.sendResponse(200, { message: "File imported" }))
    .catch(res.sendServerError);
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
