import { queryPromise } from "../db/database.js";
import { createGeneratorOfType, NotEnoughDataError } from "./question.js";

export const MAX_QUESTION_TYPE = 10;
export const NUMBER_OF_ROUNDS_IN_DUEL = 5;
export const NUMBER_OF_QUESTIONS_IN_ROUND = 5;
/**
 *
 * @api {post} /duel/new Create a new duel
 * @apiName CreateNewDuel
 * @apiGroup Duel
 * @apiPermission LoggedIn
 * @apiUse ErrorServer
 *
 * @apiParam  {string} opponent The user you are challenging
 *
 * @apiParamExample  {string} Request-Example:
 * {
 *     "opponent": "nhoun"
 * }
 *
 * @apiSuccessExample {number} Success-Response:
 * {
 *     "id" : 42
 * }
 * @apiSuccess (201) {number} id The created duel ID
 * @apiError (404) OpponentNotFound The specified opponent does not exist
 * @apiUse NotEnoughDataError
 *
 */
function create(req, res) {
  const username = req.body.auth_user;
  const opponent = req.body.opponent;

  if (!opponent) {
    return res.status(400).json({ message: "Missing opponent" });
  }

  const sendLocalError500 = (error) => sendError500(res, error);

  doUsersExist(username, opponent)
    .then((yes) => {
      if (!yes) {
        return res.status(404).json({ message: "Opponent not found" });
      }
      createRounds()
        .then((rounds) =>
          createDuelInDatabase(username, opponent, rounds)
            .then((id) => res.status(201).json({ id }))
            .catch(sendLocalError500)
        )

        .catch(sendLocalError500);
    })
    .catch(sendLocalError500);
}

/**
 *
 * @api {get} /duel/:id Get a duel by its ID
 * @apiName GetDuel
 * @apiGroup Duel
 *
 * @apiParam  {number} id The duel ID
 *
 * @apiSuccess {object}   id                  The duel id
 * @apiSuccess {string}   opponent            The opponent's username
 * @apiSuccess {number}   userScore           The current score of the user
 * @apiSuccess {number}   opponentScore       The current score of the opponent
 * @apiSuccess {boolean}  inProgress          `true` if the duel is not finished yet
 * @apiSuccess {number}   currentRound        Current round number
 *
 * @apiSuccess {array[]}  rounds                      The list of rounds
 * @apiSuccess {object[]} rounds.round                The list of questions
 * @apiSuccess {number}   rounds.round.type           The type of the question
 * @apiSuccess {string}   rounds.round.title          The title of this type of question
 * @apiSuccess {string}   rounds.round.subject        The question subject - *if the round is the current one, or finished*
 * @apiSuccess {string}   rounds.round.wording        The wording of the question - *if the round is the current, or finished*
 * @apiSuccess {string[]} rounds.round.answers        The list of answers - *if the round is the current, or finished*
 * @apiSuccess {number}   rounds.round.goodAnswer     Index of the good answer - *if the round is played by the user*
 * @apiSuccess {number}   rounds.round.userAnswer     Index of the user answer - *if the round is played by the user*
 * @apiSuccess {number}   rounds.round.opponentAnswer Index of the opponent's answer - *if the round is played by the user & the opponent*
 * 
 *
 * @apiSuccessExample {object} Success-Response:
 * {
 *      "id" : 42,
 *      "inProgress" : true,
 *      "currentRound" : 2,
 *      "opponent" : "jjgoldman",
 *      "userScore" : 3,
 *      "opponentScore" : 6,
 *      "rounds" : [
                    [
                      {
                        "type": 3,
                        "title" : "1 système - 4 molécules",
                        "subject": "ANTIBIOTIQUE",
                        "wording": "Quelle molécule appartient au système 'ANTIBIOTIQUE' ?"
                        "answers": ["TELBIVUDINE", "PYRAZINAMIDE", "RITONAVIR", "TINIDAZOLE"],
                        "goodAnswer": 1,
                        "userAnswer" : 0,
                        "opponentAnswer" : 1
                      },
                      {
                        "type": 3,
                        "title" : "1 système - 4 molécules",
                        "subject": "ANTIVIRAL",
                        "wording": "Quelle molécule appartient au système 'ANTIVIRAL' ?"
                        "answers": ["CEFIXIME", "SPIRAMYCINE", "RILPIVIRINE", "ALBENDAZOLE"],
                        "goodAnswer": 2,
                        "userAnswer" : 1,
                        "opponentAnswer" : 3
                      },
                      ...
                    ],
                    [
                      {
                        "type": 2,
                        "title" : "1 molécule - 4 classes"
                        "subject": "ZANAMIVIR",
                        "wording": "À quelle classe appartient la molécule 'ZANAMIVIR' ?"
                        "answers": [
                          "INHIBITEURS DE NEURAMINISASE", 
                          "INHIBITEUR POLYMERASE NS5B", 
                          "PHENICOLES", 
                          "OXAZOLIDINONES"
                        ],
                        "goodAnswer": 0,
                        "userAnswer" : 0,
                      },...
                    ],
                    [
                      {
                        "type" : 4,
                        "title" : "1 molécule - 4 systèmes"
                      },
                      ...
                    ]
                    ...
                  ]

 * }
 *
 * @apiError (404) NotFound The duel does not exist
 * @apiUse ErrorServer
 *
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
 *
 * @api {get} /duel Get all duels of the logged user
 * @apiName GetAllDuels
 * @apiGroup Duel
 *
 * @apiSuccess (200) {object[]} . All duels in an array
 *
 * @apiPermission LoggedIn
 * @apiUse ErrorServer
 */
function fetchAll(req, res) {
  const username = req.body.auth_user;

  getAllDuels(username)
    .then((duels) => res.status(200).json(duels))
    .catch((error) => sendError500(res, error));
}

/**
 *
 * @api {post} /duel/:id/:round Play a round of a duel
 * @apiName PlayDuelRound
 * @apiGroup Duel
 *
 * @apiParam  {number} id The duel ID
 * @apiParam  {number} round The round number
 * @apiParam  {number[]} answers The user answers
 *
 * @apiSuccess (200) {object} duel The updated duel
 *
 * @apiParamExample  {type} Request-Example:
 * {
 *     "answers" : [1,3,0,0,2]
 * }
 *
 * @apiUse ErrorServer
 * @apiError (404) NotFound Duel does not exist
 * @apiError (400) InvalidRound The round is invalid
 * @apiError (400) FinishedDuel The duel is finished
 * @apiError (400) AlreadyPlayed The user has already played this round
 * @apiError (400) InvalidAnswers The user answers are invalid
 *
 *
 */
function play(req, res) {
  const id = Number(req.params.id);
  const round = Number(req.params.round);
  const username = req.body.auth_user;
  const answers = req.body.answers ?? [];

  if (!id) {
    return res.status(400).json({ message: "Invalid or missing duel id" });
  }

  getDuel(id, username).then((duel) => {
    if (!duel) {
      return res.status(404).json({ message: "Duel not found" });
    }

    if (!duel.inProgress) {
      return res.status(400).json({ message: "This duel is finished" });
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
          .then((duel) => res.status(200).json(duel))
          .catch(sendLocalError500)
      )
      .catch(sendLocalError500);
  });
}

let mockedDuelsRounds;
/**
 * Function to control the generation of random rounds by passing a predefined set of rounds.
 * Use only for testing purposes.
 * @param {object} fakeDuelsRounds The predefined set of rounds
 */
export function _initMockedDuelRounds(fakeDuelsRounds) {
  if (process.env.NODE_ENV !== "test") {
    throw "function reserved for tests";
  }
  mockedDuelsRounds = fakeDuelsRounds;
}

export default { create, fetch, fetchAll, play };

// ***** INTERNAL FUNCTIONS *****

/**
 * while waiting for a global error handler
 */
function sendError500(res, error) {
  if (NotEnoughDataError.isInstance(error)) {
    return res.status(422).json({ message: error.message, code: error.code });
  }
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
 * Create a new duel in database and return its id
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
 * This function can be mocked : @see _initMockedDuelRounds
 * @return {Promise<object[][]>}
 */
function createRounds() {
  return new Promise((resolve, reject) => {
    if (mockedDuelsRounds) {
      resolve(mockedDuelsRounds);
    }
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
 * @returns {Promise<object>} The formatted duel
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
 * @returns {object[]} The list of formatted duels
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
  const inProgress = duel[0].du_inProgress;

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

  const formattedDuel = { id: duel[0].du_id, opponent, currentRound, inProgress, rounds: formattedRound };

  const scores = computeScores(formattedDuel);
  formattedDuel.userScore = scores.user;
  formattedDuel.opponentScore = scores.opponent;

  return formattedDuel;
}

/**
 * Get all answers of a player for a duel
 * @param {number} id The duel ID
 * @param {string} username The player username
 * @returns {Promise<number[]>} The user answers
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
        const sql =
          "UPDATE results SET re_answers = :answers WHERE us_login = :login AND du_id = :id ; CALL getDuel(:id,:login);";
        queryPromise(sql, { answers: updatedAnswers, login: username, id })
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
    let winner, looser;
    if (duel.rounds[currentRound - 1][0].opponentAnswer !== undefined) {
      if (currentRound === duel.rounds.length) {
        sql += "UPDATE duel SET du_inProgress = false WHERE du_id = :id ;";
        const scores = computeScores(duel);
        if (scores.user !== scores.opponent) {
          if (scores.user > scores.opponent) {
            winner = username;
            looser = duel.opponent;
          } else {
            winner = duel.opponent;
            looser = username;
          }
          sql += `CALL incrementUserVictories(:winner);`;
          sql += `CALL incrementUserDefeats(:looser);`;
        }
      } else {
        sql = "UPDATE duel SET du_currentRound = :round WHERE du_id = :id ;";
      }
    }
    sql += "CALL getDuel(:id,:username);";
    queryPromise(sql, { id: duel.id, username, round: currentRound + 1, winner, looser })
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

/**
 * Calculate the current score of the two players in a duel
 * @param {object} duel
 * @returns {{user : number, opponent : number}} The two players scores
 */
function computeScores(duel) {
  const end = duel.inProgress ? duel.currentRound - 1 : Infinity;
  return duel.rounds.slice(0, end).reduce(
    (scores, round) => {
      scores.user += round.reduce((score, question) => score + Number(question.userAnswer === question.goodAnswer), 0);
      scores.opponent += round.reduce(
        (score, question) => score + Number(question.opponentAnswer === question.goodAnswer),
        0
      );
      return scores;
    },
    { user: 0, opponent: 0 }
  );
}
