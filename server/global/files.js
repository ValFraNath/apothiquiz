import fs from "fs/promises";
import path from "path";

/**
 * Move a file
 * @param {string} oldPath
 * @param {string} newPath
 */
export async function moveFile(oldPath, newPath) {
  await fs.rename(oldPath, newPath);
}

/**
 * Delete files
 * @param {string} filename
 */
export async function deleteFiles(...filenames) {
  await Promise.all(filenames.map((filename) => fs.unlink(filename)));
  return;
}

/**
 * Create a directory if it does not exist
 * @param {string} dirname
 * @return {Promise}
 */
export async function createDir(dirname) {
  await fs.mkdir(dirname, { recursive: true });
}

/**
 * Get an alphabetically sorted array of files in a directory
 * @param {string} dirpath
 * @return {Promise}
 */
export async function getSortedFiles(dirpath) {
  const files = await fs.readdir(dirpath);

  return files
    .map((file) => ({
      name: file,
      time: Number(file.split(".").shift()) || 0,
    }))
    .sort((a, b) => b.time - a.time)
    .map((f) => f.name);
}

/**
 * Returns the filename without extension
 * @param {string} filename The file name
 * @returns {string} The file name without extension
 */
export function removeExtension(filename) {
  return path.parse(filename).name;
}
