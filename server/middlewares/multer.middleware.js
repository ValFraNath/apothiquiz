import fs from "fs/promises";
import path from "path";

import multer from "multer";

import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import { addErrorTitle } from "../global/Logger.js";

/**
 * Multer configuration
 */
const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    const filename = String(Date.now());
    const extension = file?.originalname?.split(".").slice(1).pop();
    req.body._uploadedFileName = filename;
    req.body._uploadedFileExtension = extension;

    callback(null, filename);
  },

  destination: (req, file, callback) => {
    const destination = path.resolve("uploads");
    req.body._uploadedFileDirectory = destination;

    fs.mkdir(destination)
      .then(() => callback(null, destination))
      .catch((error) => {
        if (error.code === "EEXIST") {
          callback(null, destination);
        } else {
          callback(addErrorTitle(error, "Can't create the uploads directory"));
        }
      });
  },
});

/**
 * Create middleware to handle imported file(s)
 * @param {boolean} multiple boolean telling if there are sevaral files to handle
 */
export function createMiddleware(multiple = false) {
  return (req, _res, next) => {
    function nextWrapper(error) {
      if (error) {
        const res = new HttpResponseWrapper(_res);
        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return res.sendUsageError(400, `Invalid field name : "${error.field}"`);
        }
        return res.sendServerError(error);
      }
      next();
    }

    return multer({ storage })[multiple ? "single" : "array"]("file")(req, _res, nextWrapper);
  };
}
