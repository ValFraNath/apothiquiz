export function increaseDate(toAdd, from = new Date()) {
  const updatedDate = from;
  updatedDate.setDate(updatedDate.getDate() + (toAdd.days ?? 0));
  updatedDate.setHours(updatedDate.getHours() + (toAdd.hours ?? 0));

  return updatedDate;
}
