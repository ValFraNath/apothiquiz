import axios from "axios";

import AuthService from "../services/auth.service";

import queryClient from "./configuredQueryClient";

/**
 * Get a user information
 * @param {string} username The user name
 * @returns {Promise<Object>} The user information
 */
export function makeGetUserInfo(username) {
  return function () {
    return new Promise((resolve, reject) => {
      axios
        .get(`/api/v1/users/${username}`)
        .then(({ data }) => resolve(data))
        .catch(reject);
    });
  };
}

/**
 * Get challengeable users from the API
 *
 * @returns {Promise<Array>} An array with all the users that we can defy
 */
export function getChallengeableUsers() {
  return new Promise((resolve, reject) => {
    const duels = queryClient.getQueryData("duels");
    if (duels === undefined) {
      queryClient.fetchQuery("duels").catch((err) => console.error(err));
      reject("Need to reload data");
      return;
    }

    axios
      .get("/api/v1/users")
      .then(({ data: users }) => {
        delete users[AuthService.getCurrentUser().pseudo];
        for (const duel of [...duels.pending, ...duels.toPlay]) {
          delete users[duel.opponent];
        }

        resolve(users);
      })
      .catch((err) => {
        console.error(err);
        reject(err);
      });
  });
}
