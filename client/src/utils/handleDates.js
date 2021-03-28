/**
 * Add a number of days and hours to a date
 *
 * @param {Object} toAdd Days and Hours to add to the given date ({days: x, hours: y})
 * @param {Date} from Date to increment
 * @returns The updated date
 */
export function incrementDate(toAdd, from = new Date()) {
  const updatedDate = from;
  updatedDate.setDate(updatedDate.getDate() + (toAdd.days ?? 0));
  updatedDate.setHours(updatedDate.getHours() + (toAdd.hours ?? 0));

  return updatedDate;
}

/**
 * Move a date to the next requested time
 * If it is March 1st, 6pm, and you want the next date at 5pm, the function
 * will return the date of March 2nd, 5pm.
 *
 * @param {Date} from Date to increment
 * @param {number} hours The
 * @param {number} minutes
 * @returns The updated date
 */
export function setDateToNextHour(from, hours, minutes) {
  const updatedDate = from;
  if (hours < updatedDate.getHours()) {
    updatedDate.setDate(updatedDate.getDate() + 1);
  }
  updatedDate.setHours(hours);
  updatedDate.setMinutes(minutes);

  return updatedDate;
}
