import path from "path";

import Zip from "adm-zip";

import { createDir, deleteFiles, getSortedFiles, moveFile } from "../global/Files.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import { analyseImagesFilenames } from "../global/images_importation/imagesAnayzer.js";
import { bindImagesToMolecules } from "../global/images_importation/imagesImporter.js";
import Logger, { addErrorTitle } from "../global/Logger.js";
import { normalizeDCI } from "../global/molecules_importation/moleculesAnalyzer.js";

const IMAGES_DIR_PATH = path.resolve("files", "images");

function importImages(req, _res) {
  const res = new HttpResponseWrapper(_res);

  if (req.files.length === 0) {
    return res.sendUsageError(400, "Fichiers manquants");
  }
  const { confirmed } = req.body;
  const ogNames = req.files.map((f) => f.originalname);

  const deleteUploadedFiles = () =>
    deleteFiles(...req.files.map((f) => f.path)).catch(Logger.error);

  const sendServerError = (error, title) => {
    res.sendServerError(addErrorTitle(error, title));
    deleteUploadedFiles();
  };

  if (confirmed === "true") {
    createDir(IMAGES_DIR_PATH)
      .then(() =>
        bindImagesToMolecules(ogNames)
          .then((imported) => {
            deletePreviousImages()
              .then(() =>
                Promise.all(
                  imported.map((file) => {
                    const filepath = req.files.find((f) => f.originalname === file).path;
                    return moveFile(filepath, path.resolve(IMAGES_DIR_PATH, normalizeDCI(file)));
                  })
                )
                  .then(() => {
                    res.sendResponse(201, {
                      message: "Images imported",
                      warnings: [],
                      imported: true,
                    });

                    deleteFiles(
                      ...req.files
                        .filter((f) => !imported.includes(f.originalname))
                        .map((f) => f.path)
                    ).catch(Logger.error);
                  })
                  .catch((error) => sendServerError(error, "Can't move images"))
              )
              .catch((error) => sendServerError(error, "Can't delete old images"));
          })
          .catch((error) => sendServerError(error, "Can't update images in database"))
      )
      .catch((error) => sendServerError(error, "Can't create the image directory"));
  } else {
    analyseImagesFilenames(ogNames)
      .then((warnings) =>
        res.sendResponse(202, {
          message: "Images tested but not imported ",
          warnings,
          imported: false,
        })
      )
      .catch((error) => sendServerError(error, "Can't analyze images"));
    deleteUploadedFiles();
  }
}

function getLastImportedFile(req, _res) {
  const res = new HttpResponseWrapper(_res);

  archiveImages()
    .then((archiveName) =>
      res.sendResponse(200, {
        url: `${req.protocol}://${req.get("host")}/api/v1/files/images/${archiveName}`,
        shortpath: `/api/v1/files/images/${archiveName}`,
        filename: archiveName,
      })
    )
    .catch((error) => res.sendServerError(addErrorTitle(error, "Can't archive the images")));
}

/**
 * Archive all images in a zip archive
 * @returns {Promise<string>} The archive name
 */
function archiveImages() {
  return new Promise((resolve, reject) => {
    const archive = new Zip();

    getSortedFiles(IMAGES_DIR_PATH)
      .then((files) => {
        files
          .filter((f) => !f.endsWith(".zip"))
          .forEach((file) => archive.addLocalFile(path.resolve(IMAGES_DIR_PATH, file)));

        const archiveName = "images-molecules.zip";
        archive.writeZip(path.resolve(IMAGES_DIR_PATH, archiveName));
        resolve(archiveName);
      })
      .catch(reject);
  });
}

/**
 * Delete previous images
 * @returns {Promise}
 */
function deletePreviousImages() {
  return new Promise((resolve, reject) => {
    getSortedFiles(IMAGES_DIR_PATH)
      .then((files) =>
        deleteFiles(...files.map((f) => path.resolve(IMAGES_DIR_PATH, f)))
          .then(() => resolve())
          .catch(reject)
      )
      .catch(reject);
  });
}

export default { importImages, getLastImportedFile };
