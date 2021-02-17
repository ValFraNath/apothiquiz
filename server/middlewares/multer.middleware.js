import fs from "fs/promises";
import path from "path";

import multer from "multer";
import { v4 as uuidv4 } from "uuid";

import HttpResponseWrapper from "../global/HttpResponseWrapper.js";
import { addErrorTitle } from "../global/Logger.js";

/**
 * Multer configuration
 */
const storage = multer.diskStorage({
  filename: (req, file, callback) => {
    const extension = path.parse(file.originalname).ext.substr(1);
    const filename = `${Date.now()}.${uuidv4()}.${extension}`;

    callback(null, filename);
  },

  destination: (req, file, callback) => {
    const destination = path.resolve("uploads");

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
export function createMulter(multiple = false) {
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

    return multer({ storage })[multiple ? "array" : "single"]("file")(req, _res, nextWrapper);
  };
}
