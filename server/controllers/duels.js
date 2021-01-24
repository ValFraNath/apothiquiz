/* eslint-disable no-unused-vars */
import { queryPromise } from "../db/database.js";
import { createGeneratorOfType, NotEnoughDataError } from "./question.js";

const MAX_QUESTION_TYPE = 10;
const NUMBER_OF_ROUNDS_IN_DUEL = 5;
const NUMBER_OF_QUESTIONS_IN_ROUND = 5;

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

// eslint-disable-next-line no-unused-vars
function fetchAll(req, res) {}

// eslint-disable-next-line no-unused-vars
function play(req, res) {}

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
    queryPromise("CALL createDuel(?,?,?)", [player1, player2, JSON.stringify(rounds)])
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

  const keepOnlyType = (question) => new Object({ type: question.type });

  rounds.map((round, i) => {
    const roundNumber = i + 1;

    // Finished rounds
    if (roundNumber < currentRound) {
      const questionWithAnswers = round.map((question, j) => {
        const userAnswer = Number(userAnswers[i][j]);
        const opponentAnswer = Number(opponentAnswers[i][j]);
        return Object.assign(question, { userAnswer, opponentAnswer });
      });
      return questionWithAnswers;
    }

    // Rounds not started
    if (roundNumber > currentRound) {
      return round.map(keepOnlyType);
    }

    // Current round
    if (roundNumber === currentRound) {
      if (userAnswers.length === currentRound) {
        const questionWithUserAnswers = round.map((question, j) => {
          const userAnswer = Number(userAnswers[i][j]);
          return Object.assign(question, { userAnswer });
        });
        return questionWithUserAnswers;
      } else {
        return round.map(keepOnlyType);
      }
    }
  });

  return { id: duel[0].du_id, currentRound, rounds };
}
