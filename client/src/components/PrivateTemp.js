import React, { useState } from "react";
import axios from "axios";

const WhoAmI = function () {
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

  return (
    <main>
      <button onClick={handleButtonClick}>Who am I ? </button>
      <span>{message !== null && message}</span>
    </main>
  );
};

export default WhoAmI;
