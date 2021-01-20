import React from "react";
import { Link } from "react-router-dom";

import InstallApp from "../system/InstallApp";

const Menu = ({ installPromptEvent, user }) => {
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
