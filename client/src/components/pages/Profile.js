import React, { useState } from "react";
import axios from "axios";

import AuthService from "../../services/auth.service";

const Profile = function () {
  const [message, setMessage] = useState(null);

  function handleButtonClick() {
    axios
      .get("/api/v1/user")
      .then((res) => {
        console.log(res);
        setMessage(res.data.pseudo);
      })
      .catch((error) => {
        console.log(error);
        setMessage("Vous devez être connecté !");
      });
  }

  function handleLogoutClick() {
    AuthService.logout();
    document.location.replace("/");
  }

  return (
    <main>
      <button onClick={handleLogoutClick}>Me déconnecter</button>

      <button onClick={handleButtonClick}>Who am I ? </button>
      <span>{message !== null && message}</span>
    </main>
  );
};

export default Profile;
