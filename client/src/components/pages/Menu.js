import React from "react";
import { Link } from "react-router-dom";

import InstallApp from "../system/InstallApp";

const Menu = ({ installPromptEvent, user }) => {
  return (
    <div id="menu">
      <div id="list">
        <Link to="/train">Entraînement libre</Link>
        {user === null && <Link to="/login">Login</Link>}
        <Link to="/private">Who am I ? (private)</Link>
        <Link to="/informations">Informations</Link>
        {installPromptEvent !== null && (
          <InstallApp installPromptEvent={installPromptEvent} />
        )}
      </div>
    </div>
  );
};

export default Menu;
