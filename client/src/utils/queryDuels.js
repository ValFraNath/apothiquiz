import axios from "axios";

import AuthService from "../services/auth.service";

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
