import axios from "axios";

import queryClient from "../utils/configuredQueryClient";

const AuthService = {};

const LOCAL_STORAGE_KEY = "user_informations";

AuthService.login = async function (pseudo, password) {
  const {
    data: { token },
  } = await axios.post("/api/v1/users/login", {
    userPseudo: pseudo,
    userPassword: password,
  });

  if (token) {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({
        pseudo,
        token,
      })
    );
  }
  return pseudo;
};

AuthService.logout = function () {
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  queryClient.clear();
};

AuthService.getCurrentUser = function () {
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
};

export default AuthService;
