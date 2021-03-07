export function formatDate(daysInPast = 0) {
  const currentDate = new Date();
  if (daysInPast !== 0) {
    currentDate.setDate(currentDate.getDate() - daysInPast);
  }

  return currentDate.toLocaleDateString("fr-FR").split("/").reverse().join("-");
}
