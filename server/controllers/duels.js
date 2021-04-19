import { queryPromise } from "../db/database.js";

import { formatDate } from "../global/dateUtils.js";
import Logger from "../global/Logger.js";

import { fetchConfigFromDB } from "./config.js";
import { createGeneratorOfType, NotEnoughDataError, getAllQuestionTypes } from "./question.js";

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
 * @apiError (404) OpponentNotFound  The specified opponent does not exist
 * @apiError (409) DuelAlreadyExists A duel against this user already exists
 * @apiUse NotEnoughDataError
 *
 * @param {object} req The http request
 * @param {HttpResponseWrapper} res The http response
 *
 */
async function create(req, res) {
  try {
    const username = req.body._auth.user;
    const { opponent } = req.body;
    const { system } = req.body;
    let { difficulty } = req.body;
    difficulty === 1 ? (difficulty = "ALL") : (difficulty = "EASY");

    const filters = { system: system, difficulty: difficulty };

    if (!opponent) {
      return res.sendUsageError(400, "Vous devez renseigner un adversaire");
    }

    if (username === opponent) {
      return res.sendUsageError(400, "Vous ne pouvez pas vous défier vous-même");
    }

    const usersExist = await doUsersExist(username, opponent);

    if (!usersExist) {
      return res.sendUsageError(404, "L'adversaire renseigné est inconnu");
    }

    const existingDuelId = await getDuelId([username, opponent]);
    if (-1 !== existingDuelId) {
      return res.sendUsageError(409, "Vous avez déjà un duel en cours avec cet adversaire", {
        id: existingDuelId,
      });
    }

    const config = await fetchConfigFromDB();

    const rounds = await createRounds(config, filters);

    const id = await createDuelInDatabase(username, opponent, rounds);

    res.sendResponse(201, { id });
  } catch (error) {
    if (NotEnoughDataError.isInstance(error)) {
      res.sendUsageError(422, "Il n'y a pas assez de données pour générer un duel", {
        code: error.code,
      });
      return;
    }
    res.sendServerError(error);
  }
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
 * @apiSuccess {string}   rounds.round.wording        The wording of the question - *if the round is the current one, or finished*
 * @apiSuccess {string[]} rounds.round.answers        The list of answers - *if the round is the current one, or finished*
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
 * @param {object} req The http response
 * @param {HttpResponseWrapper} res The http response
 */
async function fetch(req, res) {
  const username = req.body._auth.user;
  const duelID = Number(req.params.id);

  if (!duelID) {
    return res.sendUsageError(400, "L'ID du duel est manquant ou invalide");
  }

  const duel = await getDuel(duelID, username);
  if (!duel) {
    return res.sendUsageError(404, "Ce duel n'existe pas");
  }
  res.sendResponse(200, duel);
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
async function fetchAll(req, res) {
  const username = req.body._auth.user;

  const duels = await getAllDuels(username);
  res.sendResponse(200, duels);
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
async function play(req, res) {
  const id = Number(req.params.id);
  const round = Number(req.params.round);
  const username = req.body._auth.user;
  const answers = req.body.answers || [];

  if (!id) {
    return res.sendUsageError(400, "L'ID du duel est invalide ou manquant");
  }

  const duel = await getDuel(id, username);

  if (!duel) {
    return res.sendUsageError(404, "Ce duel n'existe pas");
  }

  if (!duel.inProgress) {
    return res.sendUsageError(400, "Ce duel est terminé");
  }

  if (duel.currentRound !== round) {
    return res.sendUsageError(400, "La manche du duel est invalide");
  }

  if (duel.rounds[round - 1][0].userAnswer !== undefined) {
    return res.sendUsageError(400, "Vous avez déjà joué cette manche");
  }

  if (answers.length !== duel.rounds[round - 1].length) {
    return res.sendUsageError(400, "Le nombre de réponses est incorrect");
  }

  let updatedDuel = await insertResultInDatabase(id, username, answers);

  updatedDuel = await updateDuelState(updatedDuel, username);

  res.sendResponse(200, updatedDuel);
}

let mockedDuelsRounds;
/**
 * Function to control the generation of random rounds by passing a predefined set of rounds.
 * Use only for testing purposes.
 * @param {object} fakeDuelsRounds The predefined set of rounds
 */
export function _initMockedDuelRounds(fakeDuelsRounds) {
  if (process.env.NODE_ENV !== "test") {
    Logger.error(new Error("Function reserved for tests"));
    return;
  }
  mockedDuelsRounds = fakeDuelsRounds;
}

export default { create, fetch, fetchAll, play, insertResultInDatabase, updateDuelState };

// ***** INTERNAL FUNCTIONS *****

/**
 * Check if all users in a list exist
 * @param  {...string} users The list of users
 * @returns {Promise<boolean>}
 */
async function doUsersExist(...users) {
  const sql = ` SELECT us_login \
                  FROM user \
                  WHERE us_login IN (${Array(users.length).fill("?").join(",")})
                  AND us_deleted IS NULL;`;

  const sqlRes = await queryPromise(sql, users);

  if (sqlRes.length !== users.length) {
    return false;
  }
  return true;
}

/**
 * Create a new duel in database and return its id
 * @param {string} player1 The first player login
 * @param {string} player2 The second player login
 * @param {object} rounds The rounds of the duel
 * @returns {Promise<number>} The id of the duel
 */
async function createDuelInDatabase(player1, player2, rounds) {
  const res = await queryPromise("CALL createDuel(:player1,:player2,:content)", {
    player1,
    player2,
    content: JSON.stringify(rounds),
  });
  return res[0][0].id;
}

/**
 * Create all rounds of a duel
 * @param {object} config The configuration object
 * @param {object} filters contains the filter's question (system/difficulty)
 * This function can be mocked : @see _initMockedDuelRounds
 * @throws NotEnoughDataError
 * @return {Promise<object[][]>}
 */
async function createRounds(config, filters) {
  if (mockedDuelsRounds) {
    return mockedDuelsRounds;
  }
  const types = createShuffledQuestionTypesArray();
  const rounds = [];

  while (rounds.length < config.roundsPerDuel) {
    if (types.length === 0) {
      throw new NotEnoughDataError();
    }

    try {
      rounds.push(await createRound(types.pop(), filters, config));
    } catch (error) {
      if (!NotEnoughDataError.isInstance(error)) {
        throw error;
      }
    }
  }

  return rounds;
}

/**
 * Create a round of a given question type
 * @param {number} type The question type
 * @param {object} config The configuration object
 * @param {object} filters contains the filter's question (system/difficulty)
 * @returns {Promise<object[]>} The list of questions
 */
async function createRound(type, filters, config) {
  const generateQuestion = createGeneratorOfType(type, filters.system, filters.difficulty);
  const questions = [...Array(config.questionsPerRound)].map(generateQuestion);

  return await Promise.all(questions);
}

/**
 * Create an array with all question types in a random order
 * @returns {number[]}
 */
function createShuffledQuestionTypesArray() {
  const types = getAllQuestionTypes();

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
async function getDuel(id, username) {
  const res = await queryPromise(
    "SELECT `value` FROM `server_informations` WHERE `key` = 'config_duel_rounds_per_duel'; CALL getDuel(?,?);",
    [id, username]
  );
  if (res[1].length === 0) {
    return null;
  }

  const format = formatDuel(res[1], username);
  format.TTL = res[0][0].value;
  return format;
}

/**
 * Fetch all duels of a user in database
 * @param {string} username The user requesting duels
 * @returns {Promise<object[]>} The list of formatted duels
 */
async function getAllDuels(username) {
  const res = await queryPromise("CALL getDuelsOf(?);", [username]);
  if (res[0].length === 0) {
    return [];
  }
  return Object.values(
    res[0].reduce((duels, duel) => {
      if (duels[duel.du_id]) {
        duels[duel.du_id] = formatDuel([duels[duel.du_id], duel], username);
      } else {
        duels[duel.du_id] = duel;
      }
      return duels;
    }, Object.create(null))
  );
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

  const questionTimerDuration = Number(duel[0].du_questionTimerDuration);

  const finishedDate = duel[0].du_finished ? Number(new Date(duel[0].du_finished).getTime()) : null;
  const [lastPlayed, opponentLastPlayed] = (function () {
    const duelIdCurrentPlayer = duel[0].us_login === username ? 0 : 1;
    const times = [
      duel[duelIdCurrentPlayer].re_last_time,
      duel[1 - duelIdCurrentPlayer].re_last_time,
    ];
    return times.map((value) => Number(value.getTime()));
  })();

  const userAnswers = JSON.parse(duel.find((player) => player.us_login === username).re_answers);
  const opponentAnswers = JSON.parse(
    duel.find((player) => player.us_login !== username).re_answers
  );

  const opponent = duel.find((player) => player.us_login !== username).us_login;

  const keepOnlyType = (question) => new Object({ type: question.type, title: question.title });
  const withQuestionOnly = (question) => {
    const { type, subject, answers, wording, title, goodAnswer } = question;
    return { type, title, subject, answers, wording, goodAnswer };
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
      }
      return round.map(withQuestionOnly);
    }
  });

  const formattedDuel = {
    id: duel[0].du_id,
    opponent,
    currentRound,
    inProgress,
    rounds: formattedRound,
    questionTimerDuration,
    finishedDate,
    lastPlayed,
    opponentLastPlayed,
  };

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
async function getDuelResults(id, username) {
  const sql = "SELECT re_answers FROM results WHERE us_login = ? AND du_id = ? ;";
  const res = await queryPromise(sql, [username, id]);
  return JSON.parse(res[0].re_answers);
}

/**
 * Insert user anwers in the database
 * @param {number} id The duel ID
 * @param {string} username The player username
 * @param {number[]} answers The answers sent
 * @returns {Promise<object>} The updated duel
 */
async function insertResultInDatabase(id, username, answers) {
  const previousAnswers = await getDuelResults(id, username);

  const updatedAnswers = JSON.stringify([...previousAnswers, answers]);
  const currentDate = formatDate();

  const sql =
    "UPDATE results \
    SET re_answers = :answers, re_last_time = :time \
    WHERE us_login = :login \
    AND du_id = :id ; \
    CALL getDuel(:id,:login);";

  const res = await queryPromise(sql, {
    answers: updatedAnswers,
    login: username,
    time: currentDate,
    id,
  });
  return formatDuel(res[1], username);
}

/**
 * Update the state of a duel
 * @param {object} duel The duel
 * @param {string} username The player username
 * @returns {Promise<object>} The updated duel
 */
async function updateDuelState(duel, username) {
  const { currentRound } = duel;
  let sql = "";
  let winner, looser;

  if (duel.rounds[currentRound - 1][0].opponentAnswer !== undefined) {
    if (currentRound === duel.rounds.length) {
      duel.inProgress = 0;
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

  const res = await queryPromise(sql, {
    id: duel.id,
    username,
    round: currentRound + 1,
    winner,
    looser,
  });

  const format = formatDuel(
    res.find((e) => e instanceof Array),
    username
  );

  if (format.inProgress === 0) {
    const currentDate = formatDate();
    const sql = "UPDATE duel SET du_finished = ? WHERE du_id = ?;";
    await queryPromise(sql, [currentDate, duel.id]);
  }
  return format;
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
      scores.user += round.reduce(
        (score, question) => score + Number(question.userAnswer === question.goodAnswer),
        0
      );
      scores.opponent += round.reduce(
        (score, question) => score + Number(question.opponentAnswer === question.goodAnswer),
        0
      );
      return scores;
    },
    { user: 0, opponent: 0 }
  );
}

/**
 * Check if two users have a duel in progress
 * @param {string[]} users
 * @returns {Promise<Int>} the duel id or -1
 */
async function getDuelId(users) {
  const sql = `SELECT du_id \
								FROM duel AS D	\
								WHERE D.du_inProgress = 1 \
								AND 2 = ( SELECT COUNT(*) \
														FROM results AS R \
														WHERE R.du_id = D.du_id \
														AND ( R.us_login = ? \
																OR R.us_login = ?));`;

  const res = await queryPromise(sql, users);
  if (0 === res.length) {
    return -1;
  }

  return Number(res[0].du_id);
}
