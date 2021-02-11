import path from "path";

import Zip from "adm-zip";

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

  const deleteUploadedFile = () =>
    deleteFiles(path.resolve(directory, filename)).catch(Logger.error);

  if (extension !== "zip") {
    res.sendUsageError(400, "Le fichier doit être une archive ZIP");
    deleteUploadedFile();
    return;
  }

  // const sendServorError = (error, title) => {
  //   res.sendServerError(addErrorTitle(error, title));
  //   deleteUploadedFile();
  // };

  const archive = new Zip(path.resolve(directory, filename));

  archive.extractAllTo(path.resolve(directory, "imagesOfMolecules"));

  deleteUploadedFile();

  res.sendResponse(200, req.body);
}

function getLastImportedFile() {}

export default { importImages, getLastImportedFile };
