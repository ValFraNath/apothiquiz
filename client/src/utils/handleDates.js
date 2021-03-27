export function increaseDate(toAdd, from = new Date()) {
  const updatedDate = from;
  updatedDate.setDate(updatedDate.getDate() + (toAdd.days ?? 0));
  updatedDate.setHours(updatedDate.getHours() + (toAdd.hours ?? 0));

  return updatedDate;
}

export function setDateToNextHour(d, hours, minutes) {
  const updatedDate = d;
  if (hours < updatedDate.getHours()) {
    updatedDate.setDate(updatedDate.getDate() + 1);
  }
  updatedDate.setHours(hours);
  updatedDate.setMinutes(minutes);

  return updatedDate;
}
