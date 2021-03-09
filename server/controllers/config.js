// eslint-disable-next-line no-unused-vars
import express from "express";
import mysql from "mysql";

import { queryPromise } from "../db/database.js";
// eslint-disable-next-line no-unused-vars
import { HttpResponseWrapper } from "../global/HttpControllerWrapper.js";

import { getAllQuestionTypes, createGeneratorOfType, NotEnoughDataError } from "./question.js";

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
    {
      "questionsPerRound": 5,
      "roundsPerDuel" : 6,
      "questionTimerDuration" : 12,
      "DuelLifetime" : 5
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
    {  
      "questionsPerRound": {
        "value" : 5
        "min": 1,
        "max": 10,
      },
      "questionTimerDuration": {
        "value" : 12
        "min": 2,
        "max": 20,
      },
      "roundsPerDuel": {
        "value" : 6
        "min": 1,
        "max": 8,
      },
      "duelLifetime": {
        "value" : 6
        "min": 1,
        "max": 10,
      },
    }
 *
 * @apiPermission LoggedIn
 * @apiPermission Admin
 *
 * @apiUse ErrorServer
 * 
 * @param {express.Request} req The http request
 * @param {HttpResponseWrapper} req The http request
 */
async function setConfig(req, res) {
  delete req.body._auth;

  const keys = await getConfigKeys();

  for (const key in req.body) {
    if (!(key in keys)) {
      res.sendUsageError(400, `Attribut "${key}" inconnu `);
      return;
    }
    const value = Number(req.body[key]);
    const { min, max } = keys[key];

    if (!value || value < min || value > max) {
      res.sendUsageError(400, `La valeur de "${key}" doit être un nombre entre ${min} et ${max} `);
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

  await queryPromise(sql);

  const config = await fetchConfigFromDB();
  res.sendResponse(200, formatConfig(keys, config));
}

/**
 * @api       {get}        /config   Get the duels configuration
 * @apiName   GetConfig
 * @apiGroup  Config
 *
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
    {  
      "questionsPerRound": {
        "value" : 5
        "min": 1,
        "max": 10,
      },
      "questionTimerDuration": {
        "value" : 12
        "min": 2,
        "max": 20,
      },
      "roundsPerDuel": {
        "value" : 6
        "min": 1,
        "max": 8,
      },
      "duelLifetime": {
        "value" : 6
        "min": 1,
        "max": 10,
      },
    }
 *
 * @apiPermission LoggedIn
 * @apiPermission Admin
 *
 * @apiUse ErrorServer
 * 
 * @param {express.Request} req The http request
 * @param {HttpResponseWrapper} req The http request
 */
async function fetchConfig(req, res) {
  const config = await fetchConfigFromDB();
  const keys = await getConfigKeys();
  res.sendResponse(200, formatConfig(keys, config));
}

export default { setConfig, fetchConfig };

/**
 * Fetch configuration data from database
 * @returns {Promise<object>}
 */
export async function fetchConfigFromDB() {
  const sql = "SELECT * FROM server_informations WHERE server_informations.key LIKE 'config%';";

  const config = await queryPromise(sql);
  const toNumber = (x) => (Number.isNaN(Number(x)) ? null : Number(x));
  const getValue = (key) => toNumber(config.find((row) => row.key === key)?.value);

  return {
    questionsPerRound: getValue("config_duel_questions_per_round"),
    roundsPerDuel: getValue("config_duel_rounds_per_duel"),
    questionTimerDuration: getValue("config_question_timer_duration"),
    duelLifetime: getValue("config_duel_lifetime"),
  };
}

/**
 * Get the configuration keys
 * @returns {Promise} The keys with data
 */
async function getConfigKeys() {
  const maxRoundsPerDuel = await getNumberOfQuestionTypesAvailable();

  return {
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
    duelLifetime: {
      dbKey: "config_duel_lifetime",
      min: 1,
      max: 10,
    },
  };
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
async function getNumberOfQuestionTypesAvailable() {
  const types = await Promise.all(
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
  );
  return types.reduce((sum, type) => sum + type);
}

/**
 * Update the configuration after a new import if needed :
 * - If the number of available question types decreases, the value is also decreased
 * - If the current value is 0 and new question types are available, the value is increased
 * @return {Promise}
 */
export async function updateNumberOfRoundsPerDuel() {
  const max = await getNumberOfQuestionTypesAvailable();
  const maxRoundsPerDuelByDefault = 5;
  const sql = ` UPDATE server_informations \
                      SET server_informations.value = ${max} \
                      WHERE server_informations.key = "config_duel_rounds_per_duel" AND \
                      server_informations.value > ${max};\

                      UPDATE server_informations 
                      SET server_informations.value = ${Math.min(max, maxRoundsPerDuelByDefault)} 
                      WHERE server_informations.key = "config_duel_rounds_per_duel" 
                      AND server_informations.value = 0;`;

  await queryPromise(sql);
}
