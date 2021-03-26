import axios from "axios";

import AntiCheat from "./antiCheat";
import Auth from "./authentication";

/**
 * Get all duels
 *
 * @return {Promise<Object>} An object with finished, pending, toPlay
 */
export async function getAllDuels() {
  const { data: duelsList } = await axios.get("/api/v1/duels/");

  const unvalidatedRounds = AntiCheat.getBrokendDuels();

  const outdatedDuels = duelsList.filter(({ id }) => unvalidatedRounds.includes(id));

  if (outdatedDuels.length > 0) {
    for (const duel of outdatedDuels) {
      const { currentRound, rounds, id } = duel;
      const numberOfAnswers = rounds[currentRound - 1].length;
      const answers = Array(numberOfAnswers).fill(-1);

      await axios.post(`/api/v1/duels/${id}/${currentRound}`, { answers });
      AntiCheat.validateDuel(id);
    }
    return getAllDuels();
  }

  const duels = {
    finished: [],
    pending: [],
    toPlay: [],
  };

  const listDefiedOfUsers = new Set([Auth.getCurrentUser().pseudo]);

  duelsList.forEach((val) => {
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

  const { data: usersData } = await axios.post("/api/v1/users/", [...listDefiedOfUsers]);

  duels.usersData = usersData;
  return duels;
}

/**
 * Make a function that get all information about a duel
 *
 * @param {Number} duelId The duel ID in the database
 * @return // TODO
 */
export function makeGetDuelDetails(duelId) {
  return async () => {
    const { data: duel } = await axios.get(`/api/v1/duels/${duelId}`);
    // TODO : move this user information request into
    // TODO > the request duel request body to prevent request chaining
    const { opponent } = duel;

    const currentUser = Auth.getCurrentUser();
    const { data: users } = await axios.post("/api/v1/users/", [currentUser.pseudo, opponent]);

    return {
      opponent: users[opponent],
      currentUserScore: duel.userScore,
      opponentScore: duel.opponentScore,
      // eslint-disable-next-line eqeqeq
      inProgress: duel.inProgress == true,
      rounds: duel.rounds,
      finishedDate: duel.finishedDate,
      TTL: duel.TTL,
    };
  };
}
