import path from "path";

// eslint-disable-next-line no-unused-vars
import express from "express";

import { queryPromise } from "../db/database.js";
import { HeaderErrors } from "../global/csv_reader/HeaderChecker.js";
import { createDir, deleteFiles, getSortedFiles, moveFile } from "../global/files.js";
// eslint-disable-next-line no-unused-vars
import { HttpResponseWrapper } from "../global/HttpControllerWrapper.js";

import ImagesList from "../global/images_importation/ImagesList.js";
import { parseMoleculesFromCsv } from "../global/molecules_importation/moleculesParser.js";

import { updateNumberOfRoundsPerDuel } from "./config.js";

const FILES_DIR = process.env.NODE_ENV === "test" ? "files-test" : "files";
const MOLECULES_DIR = path.resolve(FILES_DIR, "molecules");
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
 * @param {express.Request} req The http request
 * @param {HttpResponseWrapper} res The http response
 * 
 */
async function importMolecules(req, res) {
  const { confirmed } = req.body;

  if (!req.file) {
    return res.sendUsageError(400, "Fichier manquant");
  }

  const { path: filepath, filename, originalname } = req.file;

  const deleteUploadedFile = () => deleteFiles(filepath).catch(() => {});

  try {
    if (!/\.csv$/i.test(originalname)) {
      res.sendUsageError(400, "Format de fichier invalide : CSV uniquement ");
      return;
    }

    const data = await parseMoleculesFromCsv(filepath);

    if (confirmed !== "true") {
      const warnings = data.analyze();
      res.sendResponse(202, {
        message: "Fichier testé mais pas importé",
        warnings,
        imported: false,
      });
    } else {
      const sql = data.createImportSql();

      await queryPromise(sql);

      await bindAlreadyExistingImages();

      await createDir(MOLECULES_DIR);

      await moveFile(filepath, path.resolve(MOLECULES_DIR, filename));

      const files = await getSortedFiles(MOLECULES_DIR);

      await deleteFiles(...files.slice(MAX_FILE_KEPT).map((file) => `${MOLECULES_DIR}/${file}`));

      await updateNumberOfRoundsPerDuel();

      res.sendResponse(201, {
        message: "Fichier importé",
        warnings: [],
        imported: true,
      });
    }
  } catch (error) {
    if (HeaderErrors.isInstance(error)) {
      res.sendUsageError(422, "Fichier mal formaté", {
        errors: error.errors,
        imported: false,
      });
    } else {
      throw error;
    }
  } finally {
    deleteUploadedFile();
  }
}

/**
 *
 * @api {get} /import/molecules Get the last imported molecules
 * @apiName GetLastImportedMolecules
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
 * @param {express.Request} req The http request
 * @param {HttpResponseWrapper} res The http response
 */
async function getLastImportedFile(req, res) {
  const files = await getSortedFiles(MOLECULES_DIR);
  const last = files[0];

  if (!last) {
    return res.sendUsageError(404, "Aucune molécule n'a déjà été importée");
  }

  res.sendResponse(200, {
    url: `${req.protocol}://${req.get("host")}/api/v1/files/molecules/${last}`,
    shortpath: `/api/v1/files/molecules/${last}`,
    file: last,
  });
}

export default { importMolecules, getLastImportedFile };

// ****** INTERNAL FUNCTIONS ******

/**
 * Make sure molecules with an image before import always have one after
 */
async function bindAlreadyExistingImages() {
  const images = await getSortedFiles(path.resolve(FILES_DIR, "images"));
  await new ImagesList(images).bindImagesToMolecules();
}
