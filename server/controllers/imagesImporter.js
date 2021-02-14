const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "svg"];

import { deleteFiles } from "../global/Files.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import { analyseImageFilenames } from "../global/ImageFilesAnalyzer.js";
import Logger, { addErrorTitle } from "../global/Logger.js";

function importImages(req, _res) {
  const res = new HttpResponseWrapper(_res);

  if (req.files.length === 0) {
    return res.sendUsageError(400, "Fichiers manquants");
  }

  const deleteUploadedFiles = () =>
    deleteFiles(...req.files.map((f) => f.path)).catch(Logger.error);

  const invalidFileFormats = req.files
    .map((f) => f.originalname)
    .filter((f) => !new RegExp(`\\.${IMAGE_EXTENSIONS.join("|")}$`, "ig").test(f));

  if (invalidFileFormats.length > 0) {
    res.sendUsageError(
      400,
      `Format invalide (uniquement ${IMAGE_EXTENSIONS.join(", ")}) : "${invalidFileFormats.join(
        '", "'
      )}"`
    );
    deleteUploadedFiles();
    return;
  }

  const sendServorError = (error, title) => {
    res.sendServerError(addErrorTitle(error, title));
    deleteUploadedFiles();
  };

  analyseImageFilenames(req.files.map((f) => f.originalname))
    .then((warnings) =>
      res.sendResponse(202, {
        message: "Images tested but not imported ",
        warnings,
        imported: false,
      })
    )
    .catch((error) => sendServorError(error, "Can't analyze images"));

  deleteUploadedFiles();
}

function getLastImportedFile() {}

export default { importImages, getLastImportedFile };
