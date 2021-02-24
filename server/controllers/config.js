import mysql from "mysql";

import { queryPromise } from "../db/database.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";

import { getAllQuestionTypes, createGeneratorOfType, NotEnoughDataError } from "./question.js";

export const DEFAULT_CONFIG = {
  ROUNDS_PER_DUEL: 5,
  QUESTIONS_PER_ROUNDS: 5,
  QUESTION_TIMER_DURATION: 10,
};

/**
 * @api       {post}        /config   Update the duels configuration
 * @apiName   UpdateConfig
 * @apiGroup  Config
 *
 * @apiParam {string} roundsPerDuel       The number of round in a duel
 * @apiParam {string} questionsPerRound   The number of question in a round
 * @apiParam {string} questionsTimerDuration   The duration of the question timer
 *
 * @apiParamExample  {string} Request-Example:
 *  {
       "questionsPerRound": 5,
       "roundsPerDuel" : 6,
       "questionTimerDuration" : 12
    }
 *
 * @apiSuccess (200) {object} roundsPerDuel
 * @apiSuccess (200) {string} roundsPerDuel.value  The number of round in a duel
 * @apiSuccess (200) {string} roundsPerDuel.min    The minimum number of round in a duel
 * @apiSuccess (200) {string} roundsPerDuel.max    The maximun number of round in a duel
 *
 * @apiSuccess (200) {object} questionsPerRound
 * @apiSuccess (200) {string} questionsPerRound.value  The number of question in a round
 * @apiSuccess (200) {string} questionsPerRound.min    The minimum number of question in a round
 * @apiSuccess (200) {string} questionsPerRound.max    The maximun number of question in a round
 *
 * @apiSuccess (200) {object} questionTimerDuration
 * @apiSuccess (200) {string} questionTimerDuration.value  The question timer duration
 * @apiSuccess (200) {string} questionTimerDuration.min    The minimum question timer duration
 * @apiSuccess (200) {string} questionTimerDuration.max    The maximun question timer duration
 * 
 * @apiSuccessExample Success-Response:
 *  {  
      questionsPerRound: {
        "value" : 5
        "min": 1,
        "max": 10,
      },
      questionTimerDuration: {
        "value" : 12
        "min": 2,
        "max": 20,
      },
      roundsPerDuel: {
        "value" : 6
        "min": 1,
        "max": maxRoundsPerDuel,
      },
    }
 *
 * @apiPermission LoggedIn
 * @apiPermission Admin
 *
 * @apiUse ErrorServer
 */
function setConfig(req, _res) {
  const res = new HttpResponseWrapper(_res);

  delete req.body.authUser;

  getConfigKeys()
    .then((keys) => {
      for (const key in req.body) {
        if (!(key in keys)) {
          res.sendUsageError(400, `Attribut "${key}" inconnu `);
          return;
        }
        const value = Number(req.body[key]);
        const { min, max } = keys[key];

        if (!value || value < min || value > max) {
          res.sendUsageError(
            400,
            `La valeur de "${key}" doit être un nombre entre ${min} et ${max} `
          );
          return;
        }
      }

      const sql = Object.keys(req.body).reduce((sql, key) => {
        const value = mysql.escape(String(req.body[key]));
        key = mysql.escape(keys[key].dbKey);
        return (
          sql +
          `	INSERT INTO server_informations \
						VALUES (${key},${value}) \
						ON DUPLICATE KEY UPDATE server_informations.value = ${value}; `
        );
      }, "");

      queryPromise(sql)
        .then(() =>
          fetchConfigFromDB()
            .then((config) => res.sendResponse(200, formatConfig(keys, config)))
            .catch(res.sendServerError)
        )
        .catch(res.sendServerError);
    })
    .catch(res.sendServerError);
}

function fetchConfig(req, _res) {
  const res = new HttpResponseWrapper(_res);

  fetchConfigFromDB()
    .then((config) =>
      getConfigKeys()
        .then((keys) => res.sendResponse(200, formatConfig(keys, config)))
        .catch(res.sendServerError)
    )
    .catch(res.sendServerError);
}

export default { setConfig, fetchConfig };

/**
 * Fetch configuration data from database
 * @returns {Promise<object>}
 */
export function fetchConfigFromDB() {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM server_informations WHERE server_informations.key LIKE 'config%';";

    queryPromise(sql)
      .then((res) => {
        const { QUESTIONS_PER_ROUNDS, QUESTION_TIMER_DURATION, ROUNDS_PER_DUEL } = DEFAULT_CONFIG;
        const getValue = (key) => Number(res.find((row) => row.key === key)?.value) || null;

        resolve({
          questionsPerRound: getValue("config_duel_questions_per_round") || QUESTIONS_PER_ROUNDS,
          roundsPerDuel: getValue("config_duel_rounds_per_duel") || ROUNDS_PER_DUEL,
          questionTimerDuration:
            getValue("config_question_timer_duration") || QUESTION_TIMER_DURATION,
        });
      })
      .catch(reject);
  });
}

/**
 * Get the configuration keys
 * @returns {Promise} The keys with data
 */
function getConfigKeys() {
  return new Promise((resolve, reject) => {
    getNumberOfQuestionTypesAvailable()
      .then((maxRoundsPerDuel) => {
        resolve({
          questionsPerRound: {
            dbKey: "config_duel_questions_per_round",
            min: 1,
            max: 10,
          },
          questionTimerDuration: {
            dbKey: "config_question_timer_duration",
            min: 2,
            max: 20,
          },
          roundsPerDuel: {
            dbKey: "config_duel_rounds_per_duel",
            min: 1,
            max: maxRoundsPerDuel,
          },
        });
      })
      .catch(reject);
  });
}

/**
 * Format the configuration from keys and values
 * @param {object} keys The config keys
 * @param {object} values The config values
 * @returns {object} The formatted configuration
 */
function formatConfig(keys, values) {
  const res = Object.create(null);
  for (const key of Object.getOwnPropertyNames(keys)) {
    res[key] = Object.create(null);
    res[key].value = values[key];
    res[key].min = keys[key].min;
    res[key].max = keys[key].max;
  }
  return res;
}

/**
 * Compute the number of types for which there is enough data to generate questions
 * @returns {Promise<number>} The number of available types
 */
function getNumberOfQuestionTypesAvailable() {
  return new Promise((resolve, reject) => {
    Promise.all(
      getAllQuestionTypes().map((type) =>
        createGeneratorOfType(type)()
          .then(() => 1)
          .catch((e) => {
            if (NotEnoughDataError.isInstance(e)) {
              return 0;
            }
            throw e;
          })
      )
    )
      .then((types) => resolve(types.reduce((sum, type) => sum + type)))
      .catch(reject);
  });
}
