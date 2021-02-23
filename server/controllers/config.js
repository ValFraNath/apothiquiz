import mysql from "mysql";

import { queryPromise } from "../db/database.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";

export const DEFAULT_CONFIG = {
  ROUNDS_PER_DUEL: 5,
  QUESTIONS_PER_ROUNDS: 5,
  QUESTION_TIMER_DURATION: 10,
};

function setConfig(req, _res) {
  const res = new HttpResponseWrapper(_res);

  delete req.body.authUser;

  const keys = {
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
      max: 10,
    },
  };

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

  queryPromise(sql)
    .then(() =>
      fetchConfigFromDB()
        .then((config) => res.sendResponse(200, config))
        .catch(res.sendServerError)
    )
    .catch(res.sendServerError);
}

function fetchConfig(req, _res) {
  const res = new HttpResponseWrapper(_res);

  fetchConfigFromDB()
    .then((config) => res.sendResponse(200, config))
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
          questionsPerRounds: getValue("config_duel_questions_per_round") || QUESTIONS_PER_ROUNDS,
          roundsPerDuel: getValue("config_duel_rounds_per_duel") || ROUNDS_PER_DUEL,
          questionTimerDuration:
            getValue("config_question_timer_duration") || QUESTION_TIMER_DURATION,
        });
      })
      .catch(reject);
  });
}
