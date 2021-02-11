import path from "path";

import { deleteFiles } from "../global/Files.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import Logger from "../global/Logger.js";

function importImages(req, _res) {
  const res = new HttpResponseWrapper(_res);

  const {
    _uploadedFileName: filename,
    _uploadedFileExtension: extension,
    _uploadedFileDirectory: directory,
  } = req.body;

  if (!filename) {
    return res.sendUsageError(400, "Missing file");
  }

  if (extension !== "zip") {
    res.sendUsageError(400, "Le fichier doit être une archive ZIP");
    deleteUploadedFile();
    return;
  }

  const deleteUploadedFile = () =>
    deleteFiles(path.resolve(directory, filename)).catch(Logger.error);

  // const sendServorError = (error, title) => {
  //   res.sendServerError(addErrorTitle(error, title));
  //   deleteUploadedFile();
  // };

  res.sendResponse(200, req.body);
}

function getLastImportedFile() {}

export default { importImages, getLastImportedFile };
