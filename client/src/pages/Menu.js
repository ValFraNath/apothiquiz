import React from "react";
import { Link } from "react-router-dom";

import InstallApp from "../components/system/InstallApp";
import AuthService from "../services/auth.service";

const Menu = ({ installPromptEvent, user }) => {
  if (AuthService.getCurrentUser() !== null) {
    document.location.replace("/homepage");
  }

  return (
    <main id="menu">
      <div id="list">
        <Link to="/train">Entraînement libre</Link>
        {user === null && <Link to="/login">Se connecter</Link>}
        <Link to="/about">À propos</Link>
        {installPromptEvent !== null && <InstallApp installPromptEvent={installPromptEvent} />}
      </div>
    </main>
  );
};

export default Menu;
