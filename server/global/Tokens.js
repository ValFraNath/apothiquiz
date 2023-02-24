import jwt from "jsonwebtoken";

import { queryPromise } from "../db/database.js";

/**
 * Create an access token from a refresh token
 * @param {string} refreshToken The refreshToken of the user
 * @returns {string} The token
 */
function createAccessToken(refreshToken) {
  const { APOTHIQUIZ_ACCESS_TOKEN_KEY, APOTHIQUIZ_REFRESH_TOKEN_KEY } = process.env;
  const { user, isAdmin } = jwt.verify(refreshToken, APOTHIQUIZ_REFRESH_TOKEN_KEY);
  return jwt.sign({ user, isAdmin }, APOTHIQUIZ_ACCESS_TOKEN_KEY, { expiresIn: "10m" });
}

/**
 * Create a refresh token for a given user
 * @param {string} login The user login
 * @param {boolean} isAdmin Boolean telling if the user is an admin
 * @returns {Promise<string>} The token
 */
async function createRefreshToken(login, isAdmin) {
  const { APOTHIQUIZ_REFRESH_TOKEN_KEY } = process.env;
  const token = jwt.sign({ user: login, isAdmin }, APOTHIQUIZ_REFRESH_TOKEN_KEY);
  await storeRefreshToken(token, login);
  return token;
}

/**
 * Check if a refresh token exists
 * @param {string} refreshToken The token
 * @param {return} boolean
 */
async function doesRefreshTokenExist(refreshToken) {
  const sql = `SELECT COUNT(*) as tokenExists FROM token WHERE to_value = ?`;

  const { tokenExists } = (await queryPromise(sql, [refreshToken]))[0];
  return Boolean(Number(tokenExists));
}

/**
 * Delete a refresh token
 * @param {string} refreshToken The token to delete
 */
async function deleteToken(refreshToken) {
  const sql = `DELETE FROM token WHERE to_value = ?`;
  await queryPromise(sql, [refreshToken]);
}

/**
 * Store a refresh token in database
 * @param {string} refreshToken The refresh token to store
 * @param {string} login The owner of the token
 */
async function storeRefreshToken(refreshToken, login) {
  const sql = "INSERT IGNORE INTO token VALUES (?,?);";
  await queryPromise(sql, [refreshToken, login]);
}

export default {
  createAccessToken,
  createRefreshToken,
  doesRefreshTokenExist,
  deleteToken,
};
