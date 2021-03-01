import axios from "axios";

import AuthService from "../services/auth.service";

import queryClient from "./configuredQueryClient";

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
 * @returns {Promise<Array>} An array with all the users that we can defy
 */
export async function getChallengeableUsers() {
  const duels = queryClient.getQueryData("duels");
  if (duels === undefined) {
    queryClient.fetchQuery("duels");
    return;
  }

  const { data: users } = await axios.get("/api/v1/users");

  delete users[AuthService.getCurrentUser().pseudo];

  for (const duel of [...duels.pending, ...duels.toPlay]) {
    delete users[duel.opponent];
  }

  return users;
}
