import fs from "fs/promises";
import path from "path";

import { addErrorTitle } from "../global/Logger.js";

/**
 * Move a file
 * @param {string} oldPath
 * @param {string} newPath
 * @return {Promise}
 */
export function moveFile(oldPath, newPath) {
  return new Promise((resolve, reject) => {
    fs.rename(oldPath, newPath)
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't move the file")));
  });
}

/**
 * Delete files
 * @param {string} filename
 * @returns {Promise}
 */
export function deleteFiles(...filenames) {
  return new Promise((resolve, reject) => {
    Promise.all(filenames.map((filename) => fs.unlink(filename)))
      .then(resolve)
      .catch((error) => reject(addErrorTitle(error, "Can't delete files")));
  });
}

/**
 * Create a directory if it does not exist
 * @param {string} dirname
 * @return {Promise}
 */
export function createDir(dirname) {
  return new Promise((resolve, reject) => {
    fs.mkdir(dirname, { recursive: true })
      .then(() => resolve())
      .catch((error) => reject(addErrorTitle(error, "Can't create the directory")));
  });
}

/**
 * Get an alphabetically sorted array of files in a directory
 * @param {string} dirpath
 * @return {Promise}
 */
export function getSortedFiles(dirpath) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirpath)
      .then((files) =>
        resolve(
          files
            .map(
              (file) =>
                new Object({
                  name: file,
                  time: Number(file.split(".").shift()) || 0,
                })
            )
            .sort((a, b) => b.time - a.time)
            .map((f) => f.name)
        )
      )
      .catch((error) => {
        if (error.code === "ENOENT") {
          resolve([]);
        }
        reject(addErrorTitle(error, "Can't read the directory"));
      });
  });
}

/**
 * Returns the filename without extension
 * @param {string} filename The file name
 * @returns {string} The file name without extension
 */
export function removeExtension(filename) {
  return path.parse(filename).name;
}
