import cron from "node-cron";

import { queryPromise } from "../db/database.js";
import { formatDate } from "../global/dateUtils.js";

/**
 * Remove duels older than 5 days
 * Should be executed each day at 12:01 PM
 */
const removeDuels = cron.schedule("10 * * * * *", function () {
  const REMOVE_UNTIL = 5;
  const formattedDate = formatDate(REMOVE_UNTIL);

  const sql = "CALL removeOldDuels(?);";
  queryPromise(sql, [formattedDate]).catch((err) =>
    console.error("Error, can't remove old duels", err)
  );
});

/**
 * Make lose the current round for players who have not played 24 hours after the start
 * Should be executed each hour
 */
const checkDuels = cron.schedule("10 * * * * *", function () {
  console.log("hi");
});

export { removeDuels, checkDuels };
