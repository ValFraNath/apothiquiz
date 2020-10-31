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
        resolve(token);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export default AuthService;
