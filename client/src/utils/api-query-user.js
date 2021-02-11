import axios from "axios";

async function getUserInfos(username) {
  return (await axios.get(`/api/v1/users/${username}`)).data;
}

export { getUserInfos };
