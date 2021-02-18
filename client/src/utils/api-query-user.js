import axios from "axios";

/**
 * Get a user informations
 * @param {string} username The user name
 * @returns {Promise<object>} The user informations
 */
function getUserInfos(username) {
  return new Promise((resolve, reject) => {
    axios
      .get(`/api/v1/users/${username}`)
      .then((res) => resolve(res.data))
      .catch(reject);
  });
}

export { getUserInfos };
