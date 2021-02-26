import axios from "axios";

import AuthService from "../services/auth.service";

/**
 * Get all duels
 *
 * @return {Promise<Object>} An object with finished, pending, toPlay
 */
export function getAllDuels() {
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
 * Get all informations about a duel
 *
 * @param {Number} duelId The duel ID in the database
 * @return // TODO
 */
export function makeGetDuelDetails(duelId) {
  return function () {
    return new Promise((resolve, reject) => {
      axios
        .get(`/api/v1/duels/${duelId}`)
        .then((res) => {
          // TODO : move this user information request into
          // TODO > the request duel request body to prevent request chaining
          const { opponent } = res.data;

          const currentUser = AuthService.getCurrentUser();
          axios.post("/api/v1/users/", [currentUser.pseudo, opponent]).then((usersRes) => {
            resolve({
              opponent: usersRes.data[opponent],
              currentUserScore: res.data.userScore,
              opponentScore: res.data.opponentScore,
              // eslint-disable-next-line eqeqeq
              inProgress: res.data.inProgress == true,
              rounds: res.data.rounds,
            });
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  };
}
