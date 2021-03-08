export function formatDate(daysInPast = 0) {
  const currentDate = new Date();
  if (daysInPast !== 0) {
    currentDate.setDate(currentDate.getDate() - daysInPast);
  }

  const formatted = currentDate.toLocaleString("en-GB").split(", ");
  const date = formatted[0].split("/").reverse().join("-");
  const time = formatted[1];

  return `${date} ${time}`;
}

export function diffDateInHour(date1, date2) {
  return (date1.getTime() - date2.getTime()) / 3600000;
}
