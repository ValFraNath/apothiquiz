import { queryPromise } from "../db/database.js";
import HttpResponseWrapper from "../global/HttpResponseWrapper.js";

export const DEFAULT_CONFIG = {
  ROUNDS_PER_DUEL: 5,
  QUESTIONS_PER_ROUNDS: 5,
  QUESTION_TIMER_DURATION: 10,
};

function updateConfig(req, _res) {
  const res = new HttpResponseWrapper(_res);
}

function fetchConfig(req, _res) {
  const res = new HttpResponseWrapper(_res);

  fetchConfigFromDB()
    .then((config) => res.sendResponse(200, config))
    .catch(res.sendServerError);
}

export default { updateConfig, getConfig: fetchConfig };

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
