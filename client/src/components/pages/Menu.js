import React from "react";
import { Link } from "react-router-dom";

import InstallApp from "../system/InstallApp";

const Menu = ({ installPromptEvent }) => {
  return (
    <div id="menu">
      <div id="list">
        <Link to="/train">Entraînement libre</Link>
        <Link to="/informations">Informations</Link>
        {installPromptEvent !== null && (
          <InstallApp installPromptEvent={installPromptEvent} />
        )}
      </div>
    </div>
  );
};

export default Menu;
