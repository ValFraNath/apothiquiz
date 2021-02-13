import path from "path";

import Zip from "adm-zip";

import { deleteFiles } from "../global/Files.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import { analyseImageFilenames } from "../global/ImageFilesAnalyzer.js";
import Logger, { addErrorTitle } from "../global/Logger.js";

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

  // if (extension !== "zip") {
  //   res.sendUsageError(400, "Le fichier doit être une archive ZIP");
  //   deleteUploadedFile();
  //   return;
  // }

  const sendServorError = (error, title) => {
    res.sendServerError(addErrorTitle(error, title));
    deleteUploadedFile();
  };

  analyseImageFilenames([])
    .then((warnings) =>
      res.sendResponse(202, {
        message: "Images tested but not imported ",
        warnings,
        imported: false,
      })
    )
    .catch((error) => sendServorError(error, "Can't analyze images"));

  deleteUploadedFile();
}

function getLastImportedFile() {}

export default { importImages, getLastImportedFile };
