import cron from "node-cron";

import queryPromise from "../db/database";

/**
 * Remove duels older than 5 days
 * Should be executed each day at 12:01 PM
 */
const removeDuels = cron.schedule("10 * * * * *", function () {
  const sql = `DELETE FROM duels
                `;
});

/**
 * Make lose the current round for players who have not played 24 hours after the start
 * Should be executed each hour
 */
const checkDuels = cron.schedule("10 * * * * *", function () {
  console.log("hi");
});

removeDuels.start();
checkDuels.start();
