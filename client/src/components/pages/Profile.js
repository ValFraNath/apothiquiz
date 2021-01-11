import React, { useState } from "react";
import axios from "axios";

import AuthService from "../../services/auth.service";
import Avatar from "../Avatar";

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

      <Avatar eyes={1} hands={1} hat={1} mouth={1} />
    </main>
  );
};

export default Profile;
