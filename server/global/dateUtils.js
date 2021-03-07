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
