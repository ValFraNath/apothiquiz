import cron from "node-cron";

import { queryPromise } from "../db/database.js";

/**
 * Remove duels older than 5 days
 * Should be executed each day at 12:01 PM
 */
const removeDuels = cron.schedule("10 * * * * *", function () {
  const REMOVE_UNTIL = 5;

  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() - REMOVE_UNTIL);

  let formattedDate = currentDate.toLocaleDateString("fr-FR").split("/");
  formattedDate = `${formattedDate[2]}-${formattedDate[1]}-${formattedDate[0]}`;

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
