import cron from "node-cron";

import Duels from "../controllers/duels.js";
import { queryPromise } from "../db/database.js";
import { diffDateInHour, formatDate } from "../global/dateUtils.js";

/**
 * Remove duels older than 5 days
 * Should be executed each day at 12:01 PM
 */
const removeDuelsTask = cron.schedule("00 01 00 * * *", async function () {
  try {
    const res = await queryPromise(
      'SELECT `value` FROM `server_informations` WHERE `key` = "config_duel_lifetime";'
    );
    const REMOVE_UNTIL = parseInt(res[0].value);

    const formattedDate = formatDate(REMOVE_UNTIL);

    const sql = "CALL removeOldDuels(?);";
    await queryPromise(sql, [formattedDate]);
  } catch (err) {
    console.error("Error : can't remove old duels", err);
  }
});

/**
 * Make lose the current round for players who have not played 24 hours after the start
 * Should be executed every 3 hours
 */
const checkDuelsTask = cron.schedule("* * */3 * * *", async function () {
  const sql = `SELECT duel.du_id, us_login, re_answers, re_last_time \
               FROM results, duel \
               WHERE results.du_id = duel.du_id \
                 AND duel.du_inProgress = 1;`;

  try {
    const res = await queryPromise(sql);

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

    await Object.keys(duelsTime).forEach(async (key) => {
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
        const updatedDuels = await Duels.insertResultInDatabase(key, looser.user, results);
        await Duels.updateDuelState(updatedDuels, looser.user).catch((err) =>
          console.error("Error: can't update duel state", err)
        );
      }
    });
  } catch (err) {
    console.error("Error: Can't check duels", err);
  }
});

export { removeDuelsTask, checkDuelsTask };
