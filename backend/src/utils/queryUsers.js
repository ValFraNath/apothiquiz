import axios from "axios";

/**
 * Get a user information
 * @param {string} username The user name
 * @returns {Promise<Object>} The user information
 */
export function makeGetUserInfo(username) {
  return async () => (await axios.get(`/api/v1/users/${username}`)).data;
}

/**
 * Get challengeable users from the API
 *
 * @returns {Promise<Array>} An array with all the users that we can challenge
 */
export async function getChallengeableUsers() {
  const { data } = await axios.get("/api/v1/users/?challengeable=true");
  return data;
}

export async function getUsers(){
  const { data } = await axios.get("/api/v1/usersBE/all");
  return data;
}
