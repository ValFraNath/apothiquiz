import axios from "axios";

const AuthService = {};

AuthService.login = async function (pseudo, password) {
  return new Promise((resolve, reject) => {
    axios
      .post("/api/v1/user/login", {
        userPseudo: pseudo,
        userPassword: password,
      })
      .then((res) => {
        const { token } = res.data;
        if (token) {
          localStorage.setItem(
            "user",
            JSON.stringify({
              pseudo,
              token,
            })
          );
        }
        resolve(pseudo);
      })
      .catch((error) => {
        reject(
          (error &&
            error.response &&
            error.response.data &&
            error.response.data.error) ||
            error
        );
      });
  });
};

AuthService.logout = function () {
  localStorage.removeItem("user");
};

AuthService.getCurrentUser = function () {
  return JSON.parse(localStorage.getItem("user"));
};

export default AuthService;
