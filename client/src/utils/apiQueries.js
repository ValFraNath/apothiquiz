import axios from "axios";
import { QueryClient } from "react-query";

import AuthService from "../services/auth.service";

export const queryClient = new QueryClient();
queryClient.setQueryDefaults(["user", "me"], {
  queryFn: makeGetUserInfo("me"),
  staleTime: Infinity,
});
queryClient.setQueryDefaults("duels", {
  queryFn: getDuels,
  staleTime: 60 * 1000,
  refetchOnMount: "always",
});

/**
 * Get a user informations
 * @param {string} username The user name
 * @returns {Promise<Object>} The user informations
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
 * Get all duels
 *
 * @return {Promise<Object>} An object with finished, pending, toPlay
 */
export function getDuels() {
  return new Promise((resolve, reject) => {
    axios
      .get("/api/v1/duels/")
      .then(({ data }) => {
        const duels = {
          finished: [],
          pending: [],
          toPlay: [],
        };

        const listDefiedOfUsers = new Set([AuthService.getCurrentUser().pseudo]);

        data.forEach((val) => {
          if (val.inProgress === 0) {
            duels.finished.push(val);
          } else if (val.rounds[val.currentRound - 1][0].userAnswer !== undefined) {
            // Current user has played the current round
            duels.pending.push(val);
          } else {
            duels.toPlay.push(val);
          }

          listDefiedOfUsers.add(val.opponent);
        });

        axios
          .post("/api/v1/users/", [...listDefiedOfUsers])
          .then(({ data: usersData }) => {
            duels.currentUser = usersData[AuthService.getCurrentUser().pseudo];
            duels.usersData = usersData;
            resolve(duels);
          })
          .catch((error) => {
            console.error(error);
            reject(error);
          });
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

/**
 * Get challengeable users from the API
 *
 * @returns {Promise<Array>} An array with all the users that we can defy
 */
export function getChallengeableUsers() {
  return new Promise((resolve, reject) => {
    let duels = queryClient.getQueryData("duels");
    if (!duels) {
      queryClient.fetchQuery("duels").catch((err) => console.error(err));
      reject("Need to reload data");
    }

    axios
      .get("/api/v1/users")
      .then(({ data: users }) => {
        delete users[AuthService.getCurrentUser().pseudo];
        for (const duel of [...duels.pendingChallenges, ...duels.toPlayChallenges]) {
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
