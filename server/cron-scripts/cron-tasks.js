import cron from "node-cron";

import Duels from "../controllers/duels.js";
import { queryPromise } from "../db/database.js";
import { diffDateInHour, formatDate } from "../global/dateUtils.js";
import Logger from "../global/Logger.js";

/**
 * Remove duels older than 5 days
 * Should be executed each day at 12:01 PM
 */
const removeDuelsTask = cron.schedule(
  "0 1 0 * * *",
  async function () {
    try {
      const res = await queryPromise(
        'SELECT `value` FROM `server_informations` WHERE `key` = "config_duel_lifetime";'
      );
      const REMOVE_UNTIL = parseInt(res[0].value);

      const formattedDate = formatDate(REMOVE_UNTIL);

      const sql = "CALL removeOldDuels(?);";
      await queryPromise(sql, [formattedDate]);
    } catch (err) {
      Logger.error(err, "Can't remove old duels");
    }
  },
  {
    scheduled: false,
  }
);

/**
 * Make lose the current round for players who have not played 24 hours after the start
 * Should be executed every 3 hours
 */
const checkDuelsTask = cron.schedule(
  "* * */3 * * *",
  async function () {
    const sql = `SELECT duel.du_id, du_content, us_login, re_answers, re_last_time \
                 FROM results, duel \
                 WHERE results.du_id = duel.du_id \
                   AND duel.du_inProgress = 1;`;

    try {
      const listOfDuels = {};

      const res = await queryPromise(sql);
      res.forEach((element) => {
        if (!listOfDuels[element.du_id]) listOfDuels[element.du_id] = [];
        listOfDuels[element.du_id].push({
          login: element.us_login,
          content: JSON.parse(element.du_content),
          answers: JSON.parse(element.re_answers),
          lastTime: new Date(element.re_last_time),
        });
      });

      await Promise.all(
        Object.keys(listOfDuels).map(async (duelID) => {
          const currentDuel = listOfDuels[duelID];

          const usersIndexNeedToPlay = [];
          if (currentDuel[0].answers.length === currentDuel[1].answers.length) {
            // same number of rounds played
            usersIndexNeedToPlay.push(0, 1);
          } else {
            const needToPlay =
              currentDuel[0].answers.length > currentDuel[1].answers.length ? 1 : 0;
            usersIndexNeedToPlay.push(needToPlay);
          }

          await Promise.all(
            usersIndexNeedToPlay.map(async (userIndex) => {
              const hoursSinceLast = diffDateInHour(
                new Date(),
                currentDuel[1 - userIndex].lastTime
              );
              if (
                hoursSinceLast >= 24 &&
                currentDuel[userIndex].content.length > currentDuel[userIndex].answers.length
              ) {
                const numberOfAnswers = currentDuel[userIndex].content[0].length;
                const fakeAnswers = new Array(numberOfAnswers).fill(-1); // wrong answers

                const updatedDuels = await Duels.insertResultInDatabase(
                  duelID,
                  currentDuel[userIndex].login,
                  fakeAnswers
                );
                await Duels.updateDuelState(updatedDuels, currentDuel[userIndex].login);
              }
            })
          );
        })
      );
    } catch (err) {
      Logger.error(err, "Impossible to play duels older than 24 hours");
    }
  },
  {
    scheduled: false,
  }
);

export { removeDuelsTask, checkDuelsTask };
