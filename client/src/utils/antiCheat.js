const LOCAL_STORAGE_KEY = "unvalidated_rounds";

const encode = (o) => btoa(JSON.stringify(o));
const decode = (o) => JSON.parse(atob(o));

// In this context, a duel is broken when the current round is played on the client, but not validated on the server.

/**
 * Get all broken duels
 * @returns {number[]} The duel ids list
 */
function getBrokendDuels() {
  const encodedDuels = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  console.log(encodedDuels);
  const duels = encodedDuels ? decode(encodedDuels) : [];
  console.log(duels);
  return duels.map(Number);
}

/**
 * Set given duels as broken
 * @param {number[]} duels
 */
function setBrokenDuels(duels) {
  localStorage.setItem(LOCAL_STORAGE_KEY, encode(duels));
}

/**
 * Check if a duel is broken
 * @param {number} duelId The duel id
 * @returns {boolean}
 */
function isDuelBroken(duelId) {
  return getBrokendDuels().includes(duelId);
}

/**
 * Mark the given duel as broken
 * @param {number} duelId The broken duel id
 */
function markDuelAsBroken(duelId) {
  setBrokenDuels([...getBrokendDuels(), duelId]);
}

/**
 * Remove the given duel from the broken duels list
 * @param {number} duelId The duel id
 */
function validateDuel(duelId) {
  const duels = getBrokendDuels().filter((v) => v !== duelId);
  setBrokenDuels(duels);
}

export default { getBrokendDuels, markDuelAsBroken, validateDuel, isDuelBroken };
