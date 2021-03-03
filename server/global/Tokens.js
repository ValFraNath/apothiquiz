import jwt from "jsonwebtoken";

import { queryPromise } from "../db/database.js";

/**
 * Create an access token for a given user
 * @param {string} login The user login
 * @returns {string} The token
 */
function createAccessToken(login) {
  const key = process.env.ACCESS_TOKEN_KEY;
  return jwt.sign({ user: login }, key, { expiresIn: "10m" });
}

/**
 * Create a refresh token for a given user
 * @param {string} login The user login
 * @returns {string} The token
 */
function createRefreshToken(login) {
  const key = process.env.ACCESS_TOKEN_KEY;
  return jwt.sign({ user: login }, key, { expiresIn: "1d" });
}

/**
 * Check if a refresh token exists
 * @param {string} refreshToken The token
 * @param {return} boolean
 */
async function doesRefreshTokenExist(refreshToken) {
  const sql = `SELECT COUNT(*) as exists FROM refresh_token WHERE to_value = ?;`;
  const { exists } = await queryPromise(sql, [refreshToken]);
  if (Number(exists)) {
    return true;
  }
  return false;
}

/**
 * Delete a refresh token
 * @param {string} refreshToken The token to delete
 */
async function deleteToken(refreshToken) {
  const sql = `DELETE FROM refresh_token WHERE to_value = ?`;
  await queryPromise(sql, [refreshToken]);
}

export default { createAccessToken, createRefreshToken, doesRefreshTokenExist, deleteToken };
