/* eslint-disable no-unused-vars */
import { queryPromise } from "../db/database.js";
import { createGeneratorOfType, NotEnoughDataError } from "./question.js";

const MAX_QUESTION_TYPE = 10;
const NUMBER_OF_ROUNDS_IN_DUEL = 5;
const NUMBER_OF_QUESTIONS_IN_ROUND = 5;

/**
 * Create a new duel
 */
function create(req, res) {
  const username = req.body.auth_user;
  const players = req.body.players;

  if (players.length !== 2) {
    return res.status(400).json({ message: "Exactly two players must be specified" });
  }

  if (!players.includes(username)) {
    return res.status(403).json({ message: "You cannot create a duel for other players" });
  }

  const sendLocalError500 = (error) => sendError500(res, error);

  doUsersExist(...players)
    .then((yes) => {
      if (!yes) {
        return res.status(404).json({ message: "Users not found" });
      }
      createRounds()
        .then((rounds) =>
          createDuelInDatabase(players[0], players[1], rounds)
            .then((id) => res.status(201).json({ id }))
            .catch(sendLocalError500)
        )

        .catch(sendLocalError500);
    })
    .catch(sendLocalError500);
}

/**
 * Fetch a duel
 */
function fetch(req, res) {
  const sendLocalError500 = (error) => sendError500(res, error);

  const username = req.body.auth_user;
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: "Missing or invalid duel ID" });
  }

  getDuel(id, username)
    .then((duel) => {
      if (!duel) {
        return res.status(404).json({ message: "Duel not found" });
      }
      res.status(200).json(duel);
    })
    .catch(sendLocalError500);
}

/**
 * Fetch all duels of a user
 */
function fetchAll(req, res) {
  const username = req.body.auth_user;

  getAllDuels(username)
    .then((duels) => res.status(200).json(duels))
    .catch((error) => sendError500(res, error));
}

/**
 * Play a duel round
 */
function play(req, res) {
  const id = req.params.id;
  const round = Number(req.params.round);
  const username = req.body.auth_user;
  const answers = req.body.answers || [];

  getDuel(id, username).then((duel) => {
    if (!duel) {
      return res.status(404).json({ message: "Duel not found" });
    }
    if (duel.currentRound !== round) {
      return res.status(400).json({ message: "Invalid duel round" });
    }
    if (duel.rounds[round - 1][0].userAnswer !== undefined) {
      return res.status(400).json({ message: "You can only play a round once" });
    }

    if (answers.length !== duel.rounds[round - 1].length) {
      return res.status(400).json({ message: "Incorrect number of answers" });
    }

    const sendLocalError500 = (error) => sendError500(res, error);

    insertResultInDatabase(id, username, answers)
      .then((newDuel) =>
        updateDuelState(newDuel, username)
          .then((duel) =>
            udpatePlayersStats(duel)
              .then(() => res.status(200).json(duel))
              .catch(sendLocalError500)
          )
          .catch(sendLocalError500)
      )
      .catch(sendLocalError500);
  });
}

export default { create, fetch, fetchAll, play };

// ***** INTERNAL FUNCTIONS *****

/**
 * while waiting for a global error handler
 */
function sendError500(res, error) {
  console.error(error);
  return res.status(500).json({ message: "Server side error" });
}

/**
 * Check if all users in a list exist
 * @param  {...string} users The list of users
 * @returns {Promise<boolean>}
 */
function doUsersExist(...users) {
  return new Promise((resolve, reject) => {
    const sql = ` SELECT us_login \
                  FROM user \
                  WHERE us_login IN (${Array(users.length).fill("?").join(",")});`;

    queryPromise(sql, users)
      .then((sqlRes) => {
        if (sqlRes.length !== users.length) {
          resolve(false);
        }
        resolve(true);
      })
      .catch(reject);
  });
}

/**
 * Create a new duel in database and returns its id
 * @param {string} player1 The first player login
 * @param {string} player2 The second player login
 * @param {object} rounds The rounds of the duel
 * @returns {Promise<number>} The id of the duel
 */
function createDuelInDatabase(player1, player2, rounds) {
  return new Promise((resolve, reject) => {
    queryPromise("CALL createDuel(:player1,:player2,:content)", { player1, player2, content: JSON.stringify(rounds) })
      .then((res) => resolve(res[0][0].id))
      .catch(reject);
  });
}

/**
 * Create all rounds of a duel
 * @return {Promise<object[][]>}
 */
function createRounds() {
  return new Promise((resolve, reject) => {
    const types = createShuffledQuestionTypesArray();
    const rounds = [];

    (function createRoundsRecurcively() {
      if (types.length === 0) {
        reject(new NotEnoughDataError());
      }

      createRound(types.pop())
        .then((round) => {
          if (rounds.push(round) === NUMBER_OF_ROUNDS_IN_DUEL) {
            resolve(rounds);
          } else {
            createRoundsRecurcively();
          }
        })
        .catch((error) => {
          if (NotEnoughDataError.isInstance(error)) {
            createRoundsRecurcively();
          } else {
            reject(error);
          }
        });
    })();
  });
}

/**
 * Create a round of a given question type
 * @param {number} type The question type
 * @returns {Promise<object[]>} The list of questions
 */
function createRound(type) {
  return new Promise((resolve, reject) => {
    const generateQuestion = createGeneratorOfType(type);
    const questions = [...Array(NUMBER_OF_QUESTIONS_IN_ROUND)].map(generateQuestion);

    Promise.all(questions)
      .then((questions) => {
        resolve(questions);
      })
      .catch(reject);
  });
}

/**
 * Create an array with all question types in a random order
 * @returns {number[]}
 */
function createShuffledQuestionTypesArray() {
  const types = [...Array(MAX_QUESTION_TYPE)].map((_, i) => i + 1);

  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  return types;
}

/**
 * Fetch a duel in database
 * @param {number} id The duel ID
 * @param {string} username The user requesting the duel
 * @returns {Promise<object>}
 */
function getDuel(id, username) {
  return new Promise((resolve, reject) => {
    queryPromise("CALL getDuel(?,?);", [id, username])
      .then((res) => {
        if (res[0].length === 0) {
          resolve(null);
        } else {
          resolve(formatDuel(res[0], username));
        }
      })
      .catch(reject);
  });
}

/**
 * Fetch all duels of a user in database
 * @param {string} username The user requesting duels
 * @returns {object[]} The list of duels
 */
function getAllDuels(username) {
  return new Promise((resolve, reject) => {
    queryPromise("CALL getDuelsOf(?);", [username])
      .then((res) => {
        if (res[0].length === 0) {
          resolve([]);
        } else {
          resolve(
            Object.values(
              res[0].reduce((duels, duel) => {
                if (duels[duel.du_id]) {
                  duels[duel.du_id] = formatDuel([duels[duel.du_id], duel], username);
                } else {
                  duels[duel.du_id] = duel;
                }
                return duels;
              }, Object.create(null))
            )
          );
        }
      })
      .catch(reject);
  });
}

/**
 * Format the duel extracted from the database
 * @param {object} duel The duel extracted from db
 * @param {string} username The user requesting the duel
 * @returns {{id : number, currentRound : number, rounds : object[][]}} The formatted duel
 */
function formatDuel(duel, username) {
  const currentRound = duel[0].du_currentRound;
  const rounds = JSON.parse(duel[0].du_content);

  const userAnswers = JSON.parse(duel.find((player) => player.us_login === username).re_answers);
  const opponentAnswers = JSON.parse(duel.find((player) => player.us_login !== username).re_answers);

  const opponent = duel.find((player) => player.us_login !== username).us_login;

  const keepOnlyType = (question) => new Object({ type: question.type });
  const withQuestionOnly = (question) => {
    const { type, subject, answers, wording } = question;
    return { type, subject, answers, wording };
  };

  const formattedRound = rounds.map((round, i) => {
    const roundNumber = i + 1;

    const addPlayersAnswers = (question, j) => {
      const userAnswer = Number(userAnswers[i][j]);
      const opponentAnswer = opponentAnswers.length > i ? Number(opponentAnswers[i][j]) : undefined;
      return Object.assign(question, { userAnswer, opponentAnswer });
    };

    // Finished rounds
    if (roundNumber < currentRound) {
      return round.map(addPlayersAnswers);
    }

    // Rounds not started
    if (roundNumber > currentRound) {
      return round.map(keepOnlyType);
    }

    // Current round
    if (roundNumber === currentRound) {
      if (userAnswers.length === currentRound) {
        return round.map(addPlayersAnswers);
      } else {
        return round.map(withQuestionOnly);
      }
    }
  });

  return { id: duel[0].du_id, opponent, currentRound, rounds: formattedRound };
}

/**
 * Get all answers of a player for a duel
 * @param {number} id The duel ID
 * @param {string} username The player username
 */
function getDuelsResults(id, username) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT re_answers FROM results WHERE us_login = ? AND du_id = ? ;";
    queryPromise(sql, [username, id])
      .then((res) => resolve(JSON.parse(res[0].re_answers)))
      .catch(reject);
  });
}

/**
 * Insert user anwers in the database
 * @param {number} id The duel ID
 * @param {string} username The player username
 * @param {number[]} answers The answers sent
 * @returns {Promise<object>} The updated duel
 */
function insertResultInDatabase(id, username, answers) {
  return new Promise((resolve, reject) => {
    getDuelsResults(id, username)
      .then((previousAnswers) => {
        const updatedAnswers = JSON.stringify([...previousAnswers, answers]);
        const sql = "UPDATE results SET re_answers = ? WHERE us_login = ? AND du_id = ? ; CALL getDuel(?,?);";
        queryPromise(sql, [updatedAnswers, username, id, id, username])
          .then((res) => resolve(formatDuel(res[1], username)))
          .catch(reject);
      })
      .catch(reject);
  });
}

/**
 * Update the state of a duel
 * @param {object} duel The duel
 * @param {string} username The player username
 * @returns {Promise<object>} The updated duel
 */
function updateDuelState(duel, username) {
  return new Promise((resolve, reject) => {
    const currentRound = duel.currentRound;
    let sql = "";
    if (duel.rounds[currentRound - 1][0].opponentAnswer !== undefined) {
      sql = "UPDATE duel SET du_currentRound = :round WHERE du_id = :id ;";
      if (currentRound === duel.rounds.length - 1) {
        sql += "UPDATE duel SET du_inProgress = false WHERE du_id = :id ;";
      }
    }
    sql += "CALL getDuel(:id,:username);";
    queryPromise(sql, { id: duel.id, username, round: currentRound + 1 })
      .then((res) => {
        resolve(
          formatDuel(
            res.find((e) => e instanceof Array),
            username
          )
        );
      })
      .catch(reject);
  });
}

function udpatePlayersStats(duel) {
  return new Promise((resolve, reject) => {
    const userIsWinner = isUserWinner(duel);
    if (userIsWinner === 0) {
      resolve();
      return;
    }
  });
}

function isUserWinner(duel) {
  const scores = ["userAnswer", "opponentAnswer"].map((user) =>
    duel.rounds.reduce((score, round) => {
      return score + round.reduce((score, question) => score + Number(question[user] === question.goodAnswer), 0);
    }, 0)
  );
  return scores[0] - scores[1];
}
