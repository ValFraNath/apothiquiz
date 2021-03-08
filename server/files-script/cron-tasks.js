import cron from "node-cron";

import Duels from "../controllers/duels.js";
import { queryPromise } from "../db/database.js";
import { diffDateInHour, formatDate } from "../global/dateUtils.js";

/**
 * Remove duels older than 5 days
 * Should be executed each day at 12:01 PM
 */
const removeDuels = cron.schedule("00 01 00 * * *", function () {
  const REMOVE_UNTIL = 5;
  const formattedDate = formatDate(REMOVE_UNTIL);

  const sql = "CALL removeOldDuels(?);";
  queryPromise(sql, [formattedDate]).catch((err) =>
    console.error("Error, can't remove old duels", err)
  );
});

/**
 * Make lose the current round for players who have not played 24 hours after the start
 * Should be executed every 3 hours
 */
const checkDuels = cron.schedule("* * */3 * * *", function () {
  const sql = `SELECT duel.du_id, us_login, re_answers, re_last_time \
               FROM results, duel \
               WHERE results.du_id = duel.du_id \
                 AND duel.du_inProgress = 1;`;

  queryPromise(sql)
    .then((res) => {
      const duelsTime = {};

      res.forEach((data) => {
        const lastTime = data.re_last_time;
        if (!duelsTime[data.du_id]) {
          duelsTime[data.du_id] = [];
        }
        duelsTime[data.du_id].push({
          user: data.us_login,
          answers: data.re_answers,
          time: lastTime === null ? null : new Date(lastTime),
        });
      });

      Object.keys(duelsTime).forEach((key) => {
        const currentRound = duelsTime[key];

        let indexLastPlayed;
        if (currentRound[0].time === null || currentRound[1].time === null) {
          indexLastPlayed = currentRound[0].time ? 0 : 1;
        } else {
          indexLastPlayed = currentRound[0].time > currentRound[1].time ? 0 : 1;
        }

        if (diffDateInHour(new Date(), currentRound[indexLastPlayed].time) >= 24) {
          const resSample = JSON.parse(currentRound[indexLastPlayed].answers)[0];
          const looser = currentRound[indexLastPlayed ^ 1];

          const results = new Array(resSample.length).fill(-1);
          Duels.insertResultInDatabase(key, looser.user, results)
            .then((updatedDuels) => {
              Duels.updateDuelState(updatedDuels, looser.user).catch((err) =>
                console.error("Error: can't update duel state", err)
              );
            })
            .catch((err) => console.error("Error: can't update result in database", err));
        }
      });
    })
    .catch((err) => console.error("Error: can't get in progress duels", err));
});

export { removeDuels, checkDuels };
